import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isEndUser = session.user.role === "EndUser";
  const userFilter = isEndUser ? { creatorId: session.user.id } : {};

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // --- Avg Resolution Hours ---
  const resolvedTickets = await prisma.ticket.findMany({
    where: { ...userFilter, status: { in: ["Resolved", "Closed"] } },
    select: { createdAt: true, updatedAt: true },
  });
  const avgResolutionHours =
    resolvedTickets.length > 0
      ? Math.round(
          resolvedTickets.reduce((sum, t) => {
            const diffMs = t.updatedAt.getTime() - t.createdAt.getTime();
            return sum + diffMs / (1000 * 60 * 60);
          }, 0) / resolvedTickets.length
        )
      : 0;

  // Last month resolution hours for trend
  const lastMonthResolved = await prisma.ticket.findMany({
    where: {
      ...userFilter,
      status: { in: ["Resolved", "Closed"] },
      updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
    },
    select: { createdAt: true, updatedAt: true },
  });
  const lastMonthAvgResolution =
    lastMonthResolved.length > 0
      ? lastMonthResolved.reduce((sum, t) => {
          return sum + (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / lastMonthResolved.length
      : 0;
  const resolutionTrend =
    lastMonthAvgResolution > 0
      ? Math.round(((avgResolutionHours - lastMonthAvgResolution) / lastMonthAvgResolution) * 100)
      : 0;

  // --- Avg First Response Hours ---
  const ticketsWithComments = await prisma.ticket.findMany({
    where: userFilter,
    select: {
      createdAt: true,
      comments: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  const ticketsWithFirstComment = ticketsWithComments.filter((t) => t.comments.length > 0);
  const avgFirstResponseHours =
    ticketsWithFirstComment.length > 0
      ? Math.round(
          ticketsWithFirstComment.reduce((sum, t) => {
            const diffMs = t.comments[0].createdAt.getTime() - t.createdAt.getTime();
            return sum + Math.max(0, diffMs) / (1000 * 60 * 60);
          }, 0) / ticketsWithFirstComment.length
        )
      : 0;

  // Last month response trend
  const lastMonthTickets = await prisma.ticket.findMany({
    where: { ...userFilter, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    select: {
      createdAt: true,
      comments: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  const lastMonthWithComment = lastMonthTickets.filter((t) => t.comments.length > 0);
  const lastMonthAvgResponse =
    lastMonthWithComment.length > 0
      ? lastMonthWithComment.reduce((sum, t) => {
          return sum + Math.max(0, t.comments[0].createdAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / lastMonthWithComment.length
      : 0;
  const responseTrend =
    lastMonthAvgResponse > 0
      ? Math.round(((avgFirstResponseHours - lastMonthAvgResponse) / lastMonthAvgResponse) * 100)
      : 0;

  // --- Resolved This Month ---
  const [resolvedThisMonth, resolvedLastMonth] = await Promise.all([
    prisma.ticket.count({
      where: { ...userFilter, status: { in: ["Resolved", "Closed"] }, updatedAt: { gte: thisMonthStart } },
    }),
    prisma.ticket.count({
      where: {
        ...userFilter,
        status: { in: ["Resolved", "Closed"] },
        updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
  ]);
  const resolvedTrend =
    resolvedLastMonth > 0
      ? Math.round(((resolvedThisMonth - resolvedLastMonth) / resolvedLastMonth) * 100)
      : resolvedThisMonth > 0
      ? 100
      : 0;

  // --- Last 7 Days ---
  const last7Days = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return d;
    }).map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const [opened, closed] = await Promise.all([
        prisma.ticket.count({ where: { ...userFilter, createdAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.ticket.count({
          where: {
            ...userFilter,
            status: { in: ["Resolved", "Closed"] },
            updatedAt: { gte: dayStart, lte: dayEnd },
          },
        }),
      ]);
      return { date: formatDayLabel(day), opened, closed };
    })
  );

  // --- Priority Breakdown ---
  const priorityGroups = await prisma.ticket.groupBy({
    by: ["priority"],
    where: userFilter,
    _count: true,
  });
  const priorityBreakdown = { Low: 0, Normal: 0, High: 0, Urgent: 0 };
  for (const g of priorityGroups) {
    if (g.priority in priorityBreakdown) {
      priorityBreakdown[g.priority as keyof typeof priorityBreakdown] = g._count;
    }
  }

  // --- Active Users (last 30 days, not for EndUser) ---
  let activeUsers = 0;
  if (!isEndUser) {
    const [ticketCreators, commentAuthors] = await Promise.all([
      prisma.ticket.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { creatorId: true },
        distinct: ["creatorId"],
      }),
      prisma.comment.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
    ]);
    const uniqueUsers = new Set([
      ...ticketCreators.map((t) => t.creatorId),
      ...commentAuthors.map((c) => c.authorId),
    ]);
    activeUsers = uniqueUsers.size;
  }

  // --- Unassigned Open Tickets ---
  const unassignedCount = await prisma.ticket.count({
    where: { ...userFilter, assigneeId: null, status: { in: ["Open", "InProgress"] } },
  });

  // --- Avg Comments Per Ticket ---
  const [totalComments, totalTickets] = await Promise.all([
    prisma.comment.count({ where: isEndUser ? { ticket: { creatorId: session.user.id } } : {} }),
    prisma.ticket.count({ where: userFilter }),
  ]);
  const avgCommentsPerTicket =
    totalTickets > 0 ? Math.round((totalComments / totalTickets) * 10) / 10 : 0;

  return NextResponse.json({
    avgResolutionHours,
    avgFirstResponseHours,
    resolvedThisMonth,
    resolutionTrend,
    responseTrend,
    resolvedTrend,
    last7Days,
    priorityBreakdown,
    activeUsers,
    unassignedCount,
    avgCommentsPerTicket,
  });
}
