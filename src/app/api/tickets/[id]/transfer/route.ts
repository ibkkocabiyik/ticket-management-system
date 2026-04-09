import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyTransferRequest } from "@/lib/notifications";

interface Params { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SupportTeam") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, assigneeId: true },
  });
  if (!ticket) return NextResponse.json({ message: "Talep bulunamadı" }, { status: 404 });
  if (ticket.assigneeId !== session.user.id) {
    return NextResponse.json({ message: "Bu talebin sahibi değilsiniz" }, { status: 403 });
  }

  let body: { toUserId?: string };
  try { body = await request.json() as { toUserId?: string }; } catch {
    return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
  }
  if (!body.toUserId) return NextResponse.json({ message: "Hedef kullanıcı belirtilmedi" }, { status: 400 });

  const toUser = await prisma.user.findUnique({
    where: { id: body.toUserId, role: "SupportTeam" },
    select: { id: true, name: true },
  });
  if (!toUser) return NextResponse.json({ message: "Geçersiz hedef kullanıcı" }, { status: 400 });

  // Bekleyen bir talep varsa iptal et
  await prisma.transferRequest.updateMany({
    where: { ticketId: params.id, fromUserId: session.user.id, status: "pending" },
    data: { status: "rejected" },
  });

  const transferRequest = await prisma.transferRequest.create({
    data: {
      ticketId: params.id,
      fromUserId: session.user.id,
      toUserId: body.toUserId,
      status: "pending",
    },
  });

  void notifyTransferRequest(params.id, ticket.title, session.user.name, body.toUserId, transferRequest.id);

  return NextResponse.json(transferRequest, { status: 201 });
}
