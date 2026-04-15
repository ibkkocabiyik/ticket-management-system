import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTicketSchema, ticketFiltersSchema } from "@/lib/validations/ticket";
import { notifyTicketCreated } from "@/lib/notifications";
import type { Priority } from "@/types";

const PRIORITY_ORDER: Record<Priority, number> = {
  Low: 1,
  Normal: 2,
  High: 3,
  Urgent: 4,
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = ticketFiltersSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid filters", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, priority, categoryId, search, page, pageSize, sortBy, sortOrder, assignedToMe } = parsed.data;

  const where: Record<string, unknown> = {};

  if (session.user.role === "EndUser") {
    where.creatorId = session.user.id;
  }

  if (session.user.role === "SupportTeam" && assignedToMe) {
    where.assigneeId = session.user.id;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.title = { contains: search };
  }

  const total = await prisma.ticket.count({ where });

  let tickets;
  if (sortBy === "priority") {
    tickets = await prisma.ticket.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        category: true,
        _count: { select: { comments: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });

    tickets.sort((a, b) => {
      const aPrio = PRIORITY_ORDER[a.priority as Priority] ?? 2;
      const bPrio = PRIORITY_ORDER[b.priority as Priority] ?? 2;
      return sortOrder === "asc" ? aPrio - bPrio : bPrio - aPrio;
    });
  } else {
    tickets = await prisma.ticket.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        category: true,
        _count: { select: { comments: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  return NextResponse.json({
    data: tickets,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, categoryId, priority } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      categoryId,
      priority,
      creatorId: session.user.id,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: true,
    },
  });

  // Notify admins about new ticket (fire-and-forget)
  void notifyTicketCreated(
    ticket.id,
    ticket.title,
    session.user.name,
    session.user.id
  );

  // Log ticket creation (await — history must be written before response)
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      userId: session.user.id,
      action: "ticket_created",
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
