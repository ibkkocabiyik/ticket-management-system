import { prisma } from "./db";
import { sendToUser } from "./sse";

type NotificationType =
  | "ticket_created"
  | "comment_added"
  | "status_changed"
  | "ticket_assigned";

const STATUS_TR: Record<string, string> = {
  Open: "Açık",
  InProgress: "Devam Ediyor",
  Waiting: "Beklemede",
  Resolved: "Çözüldü",
  Closed: "Kapatıldı",
};

function tr(status: string): string {
  return STATUS_TR[status] ?? status;
}

async function createNotificationForUser(
  userId: string,
  type: NotificationType,
  message: string,
  ticketId?: string
) {
  const notification = await prisma.notification.create({
    data: { userId, type, message, ticketId: ticketId ?? null },
  });
  sendToUser(userId, { type: "notification", notification });
  return notification;
}

async function getAdminIds(excludeUserId: string): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "Admin", id: { not: excludeUserId } },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

export async function notifyTicketCreated(
  ticketId: string,
  ticketTitle: string,
  creatorName: string,
  excludeUserId: string
) {
  const adminIds = await getAdminIds(excludeUserId);
  await Promise.all(
    adminIds.map((id) =>
      createNotificationForUser(
        id,
        "ticket_created",
        `${creatorName} tarafından yeni talep oluşturuldu: "${ticketTitle}"`,
        ticketId
      )
    )
  );
}

export async function notifyCommentAdded(
  ticketId: string,
  ticketTitle: string,
  authorName: string,
  creatorId: string,
  assigneeId: string | null,
  excludeUserId: string
) {
  const usersToNotify = new Set<string>();

  if (creatorId !== excludeUserId) usersToNotify.add(creatorId);
  if (assigneeId && assigneeId !== excludeUserId) usersToNotify.add(assigneeId);

  const adminIds = await getAdminIds(excludeUserId);
  adminIds.forEach((id) => usersToNotify.add(id));

  await Promise.all(
    Array.from(usersToNotify).map((userId) =>
      createNotificationForUser(
        userId,
        "comment_added",
        `${authorName}, "${ticketTitle}" talebine yorum yaptı`,
        ticketId
      )
    )
  );
}

export async function notifyStatusChanged(
  ticketId: string,
  ticketTitle: string,
  updaterName: string,
  oldStatus: string,
  newStatus: string,
  creatorId: string,
  assigneeId: string | null,
  excludeUserId: string
) {
  const usersToNotify = new Set<string>();

  if (creatorId !== excludeUserId) usersToNotify.add(creatorId);
  if (assigneeId && assigneeId !== excludeUserId) usersToNotify.add(assigneeId);

  const adminIds = await getAdminIds(excludeUserId);
  adminIds.forEach((id) => usersToNotify.add(id));

  await Promise.all(
    Array.from(usersToNotify).map((userId) =>
      createNotificationForUser(
        userId,
        "status_changed",
        `"${ticketTitle}" durumu ${tr(oldStatus)} → ${tr(newStatus)} olarak güncellendi (${updaterName})`,
        ticketId
      )
    )
  );
}

export async function notifyTicketAssigned(
  ticketId: string,
  ticketTitle: string,
  assigneeName: string,
  assigneeId: string,
  creatorId: string,
  excludeUserId: string
) {
  const usersToNotify = new Map<string, string>();

  if (assigneeId !== excludeUserId) {
    usersToNotify.set(
      assigneeId,
      `"${ticketTitle}" talebi size atandı`
    );
  }

  if (creatorId !== excludeUserId) {
    usersToNotify.set(
      creatorId,
      `"${ticketTitle}" talebi ${assigneeName} kişisine atandı`
    );
  }

  const adminIds = await getAdminIds(excludeUserId);
  adminIds.forEach((id) => {
    if (!usersToNotify.has(id)) {
      usersToNotify.set(id, `"${ticketTitle}" talebi ${assigneeName} kişisine atandı`);
    }
  });

  await Promise.all(
    Array.from(usersToNotify.entries()).map(([userId, message]) =>
      createNotificationForUser(userId, "ticket_assigned", message, ticketId)
    )
  );
}

export async function notifyTicketReleased(
  ticketId: string,
  ticketTitle: string,
  releasedByName: string,
  creatorId: string,
  excludeUserId: string
) {
  const usersToNotify = new Set<string>();

  if (creatorId !== excludeUserId) usersToNotify.add(creatorId);

  const adminIds = await getAdminIds(excludeUserId);
  adminIds.forEach((id) => usersToNotify.add(id));

  await Promise.all(
    Array.from(usersToNotify).map((userId) =>
      createNotificationForUser(
        userId,
        "ticket_assigned",
        `"${ticketTitle}" talebi ${releasedByName} tarafından bırakıldı`,
        ticketId
      )
    )
  );
}
