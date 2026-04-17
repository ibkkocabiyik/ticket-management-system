import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTicketSchema } from "@/lib/validations/ticket";
import {
  notifyStatusChanged,
  notifyTicketAssigned,
  notifyTicketReleased,
} from "@/lib/notifications";

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: true,
      tags: true,
      attachments: true,
      _count: { select: { comments: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
  }

  if (session.user.role === "EndUser" && ticket.creatorId !== session.user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Bekleyen devir isteği var mı?
  const pendingTransfer = await prisma.transferRequest.findFirst({
    where: { ticketId: params.id, fromUserId: session.user.id, status: "pending" },
    select: { id: true, toUser: { select: { name: true } } },
  });

  return NextResponse.json({ ...ticket, pendingTransferId: pendingTransfer?.id ?? null, pendingTransferToName: pendingTransfer?.toUser.name ?? null });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
  }

  if (session.user.role === "EndUser" && ticket.creatorId !== session.user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // SupportTeam: başka birine atanmış talebi düzenleyemez; atanmamışsa üstlenebilir
  if (
    session.user.role === "SupportTeam" &&
    ticket.assigneeId !== null &&
    ticket.assigneeId !== session.user.id
  ) {
    return NextResponse.json({ message: "Bu talebi düzenleme yetkiniz yok" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (session.user.role === "EndUser") {
    const { title, description } = data;
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: { ...(title && { title }), ...(description && { description }) },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        category: true,
        tags: true,
      },
    });
    return NextResponse.json(updatedTicket);
  }

  // resolvedAt state transition
  const TERMINAL = ["Resolved", "Closed"];
  let resolvedAtUpdate: { resolvedAt?: Date | null } = {};
  if (data.status) {
    const wasTerminal = TERMINAL.includes(ticket.status);
    const willBeTerminal = TERMINAL.includes(data.status);
    if (!wasTerminal && willBeTerminal) {
      resolvedAtUpdate = { resolvedAt: new Date() };
    } else if (wasTerminal && !willBeTerminal) {
      resolvedAtUpdate = { resolvedAt: null };
    }
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: params.id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
      ...(data.tagIds !== undefined && {
        tags: { set: data.tagIds.map((id) => ({ id })) },
      }),
      ...resolvedAtUpdate,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: true,
      tags: true,
    },
  });

  // Build history entries for changed fields
  const historyEntries: {
    ticketId: string;
    userId: string;
    action: string;
    field?: string;
    oldValue?: string | null;
    newValue?: string | null;
  }[] = [];

  const statusLabels: Record<string, string> = {
    Open: "Açık", InProgress: "İşlemde", Waiting: "Beklemede",
    Resolved: "Çözüldü", Closed: "Kapatıldı",
  };
  const priorityLabels: Record<string, string> = {
    Low: "Düşük", Normal: "Normal", High: "Yüksek", Urgent: "Acil",
  };

  if (data.status && data.status !== ticket.status) {
    historyEntries.push({
      ticketId: ticket.id, userId: session.user.id,
      action: "status_changed", field: "Durum",
      oldValue: statusLabels[ticket.status] ?? ticket.status,
      newValue: statusLabels[data.status] ?? data.status,
    });
  }
  if (data.priority && data.priority !== ticket.priority) {
    historyEntries.push({
      ticketId: ticket.id, userId: session.user.id,
      action: "priority_changed", field: "Öncelik",
      oldValue: priorityLabels[ticket.priority] ?? ticket.priority,
      newValue: priorityLabels[data.priority] ?? data.priority,
    });
  }
  if (data.assigneeId !== undefined) {
    if (data.assigneeId === null && ticket.assigneeId) {
      const prevAssignee = await prisma.user.findUnique({
        where: { id: ticket.assigneeId }, select: { name: true },
      });
      historyEntries.push({
        ticketId: ticket.id, userId: session.user.id,
        action: "assignee_released", field: "Atanan",
        oldValue: prevAssignee?.name ?? ticket.assigneeId,
        newValue: null,
      });
    } else if (data.assigneeId && data.assigneeId !== ticket.assigneeId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: data.assigneeId }, select: { name: true },
      });
      historyEntries.push({
        ticketId: ticket.id, userId: session.user.id,
        action: "assignee_changed", field: "Atanan",
        oldValue: ticket.assigneeId ? (await prisma.user.findUnique({ where: { id: ticket.assigneeId }, select: { name: true } }))?.name ?? null : null,
        newValue: newAssignee?.name ?? data.assigneeId,
      });
    }
  }
  if (data.title && data.title !== ticket.title) {
    historyEntries.push({
      ticketId: ticket.id, userId: session.user.id,
      action: "title_changed", field: "Başlık",
      oldValue: ticket.title, newValue: data.title,
    });
  }

  if (historyEntries.length > 0) {
    await prisma.ticketHistory.createMany({ data: historyEntries });
  }

  // Fire-and-forget notifications
  if (data.status && data.status !== ticket.status) {
    void notifyStatusChanged(
      ticket.id,
      ticket.title,
      session.user.name,
      ticket.status,
      data.status,
      ticket.creatorId,
      ticket.assigneeId,
      session.user.id
    );
  }

  if (data.assigneeId !== undefined) {
    if (data.assigneeId === null) {
      // Ticket released
      void notifyTicketReleased(
        ticket.id,
        ticket.title,
        session.user.name,
        ticket.creatorId,
        session.user.id
      );
    } else if (data.assigneeId !== ticket.assigneeId) {
      // New assignee
      const assignee = await prisma.user.findUnique({
        where: { id: data.assigneeId },
        select: { name: true },
      });
      if (assignee) {
        void notifyTicketAssigned(
          ticket.id,
          ticket.title,
          assignee.name,
          data.assigneeId,
          ticket.creatorId,
          session.user.id
        );
      }
    }
  }

  return NextResponse.json(updatedTicket);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
  }

  await prisma.ticket.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Ticket deleted" });
}
