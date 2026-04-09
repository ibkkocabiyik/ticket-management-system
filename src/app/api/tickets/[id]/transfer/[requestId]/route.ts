import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyTransferApproved, notifyTransferRejected } from "@/lib/notifications";

interface Params { params: { id: string; requestId: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const transferRequest = await prisma.transferRequest.findUnique({
    where: { id: params.requestId },
    include: {
      ticket: { select: { id: true, title: true, assigneeId: true } },
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
  });

  if (!transferRequest) return NextResponse.json({ message: "Devir isteği bulunamadı" }, { status: 404 });
  if (transferRequest.toUserId !== session.user.id) return NextResponse.json({ message: "Bu isteğe yanıt verme yetkiniz yok" }, { status: 403 });
  if (transferRequest.status !== "pending") return NextResponse.json({ message: "Bu istek artık beklemede değil" }, { status: 400 });

  let body: { action?: string };
  try { body = await request.json() as { action?: string }; } catch {
    return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ message: "Geçersiz işlem" }, { status: 400 });
  }

  if (body.action === "approve") {
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: transferRequest.ticketId },
        data: { assigneeId: session.user.id },
      }),
      prisma.transferRequest.update({
        where: { id: params.requestId },
        data: { status: "approved" },
      }),
    ]);
    void notifyTransferApproved(
      transferRequest.ticketId,
      transferRequest.ticket.title,
      session.user.name,
      transferRequest.fromUserId,
      params.requestId
    );
  } else {
    await prisma.transferRequest.update({
      where: { id: params.requestId },
      data: { status: "rejected" },
    });
    void notifyTransferRejected(
      transferRequest.ticketId,
      transferRequest.ticket.title,
      session.user.name,
      transferRequest.fromUserId,
      params.requestId
    );
  }

  return NextResponse.json({ success: true });
}
