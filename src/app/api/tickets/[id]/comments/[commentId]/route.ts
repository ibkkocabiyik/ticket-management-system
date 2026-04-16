import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyAdminAction } from "@/lib/notifications";

interface Params {
  params: { id: string; commentId: string };
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

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment || comment.ticketId !== params.id) {
    return NextResponse.json({ message: "Comment not found" }, { status: 404 });
  }

  await prisma.comment.delete({ where: { id: params.commentId } });

  if (ticket.assigneeId) {
    void notifyAdminAction(ticket.id, ticket.title, session.user.name, "bir yorumu sildi", ticket.assigneeId);
  }

  return new NextResponse(null, { status: 204 });
}
