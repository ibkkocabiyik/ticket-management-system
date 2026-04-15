import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCommentSchema } from "@/lib/validations/comment";
import { notifyCommentAdded } from "@/lib/notifications";

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
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

  const comments = await prisma.comment.findMany({
    where: { ticketId: params.id },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      attachments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, { params }: Params) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      authorId: session.user.id,
      ticketId: params.id,
    },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      attachments: true,
    },
  });

  // Ticket geçmişine yorum kaydı ekle
  void prisma.ticketHistory.create({
    data: {
      ticketId: params.id,
      userId: session.user.id,
      action: "comment_added",
      field: null,
      oldValue: null,
      newValue: null,
    },
  });

  // Fire-and-forget notifications
  void notifyCommentAdded(
    ticket.id,
    ticket.title,
    session.user.name,
    ticket.creatorId,
    ticket.assigneeId,
    session.user.id
  );

  return NextResponse.json(comment, { status: 201 });
}
