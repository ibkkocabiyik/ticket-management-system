import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTicketSchema, ticketFiltersSchema } from "@/lib/validations/ticket";
import { notifyTicketCreated } from "@/lib/notifications";
import type { Priority } from "@/types";
import { SLA_HOURS } from "@/lib/sla";

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

  const { status, priority, categoryId, search, page, pageSize, sortBy, sortOrder, assignedToMe, tags, overdue } = parsed.data;

  const where: Record<string, unknown> = {};
  const andFilters: Record<string, unknown>[] = [];

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
    const term = search.trim();
    if (term.length > 0) {
      andFilters.push({
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      });
    }
  }
  if (tags && tags.length > 0) {
    where.tags = { some: { id: { in: tags } } };
  }
  if (overdue) {
    const now = Date.now();
    andFilters.push({
      status: { notIn: ["Resolved", "Closed"] },
      OR: (Object.entries(SLA_HOURS) as [Priority, number][]).map(([p, h]) => ({
        priority: p,
        createdAt: { lt: new Date(now - h * 3600 * 1000) },
      })),
    });
  }
  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  const include = {
    creator: { select: { id: true, name: true, email: true } },
    assignee: { select: { id: true, name: true, email: true } },
    category: true,
    tags: true,
    _count: { select: { comments: true } },
  } as const;

  const [total, ticketsRaw] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: sortBy === "priority" ? { createdAt: "desc" } : { [sortBy]: sortOrder },
    }),
  ]);

  const tickets = sortBy === "priority"
    ? [...ticketsRaw].sort((a, b) => {
        const aPrio = PRIORITY_ORDER[a.priority as Priority] ?? 2;
        const bPrio = PRIORITY_ORDER[b.priority as Priority] ?? 2;
        return sortOrder === "asc" ? aPrio - bPrio : bPrio - aPrio;
      })
    : ticketsRaw;

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

  if (session.user.role === "SupportTeam") {
    return NextResponse.json({ message: "Destek ekibi talep oluşturamaz" }, { status: 403 });
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

  const { title, description, categoryId, priority, tagIds } = parsed.data;

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
      ...(tagIds && tagIds.length > 0 && {
        tags: { connect: tagIds.map((id) => ({ id })) },
      }),
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: true,
      tags: true,
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
