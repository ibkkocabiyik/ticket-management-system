import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const where =
    session.user.role === "EndUser"
      ? { creatorId: session.user.id }
      : undefined;

  const grouped = await prisma.ticket.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of grouped) {
    counts[row.status] = row._count._all;
    total += row._count._all;
  }

  return NextResponse.json({
    total,
    open: counts.Open ?? 0,
    inProgress: counts.InProgress ?? 0,
    waiting: counts.Waiting ?? 0,
    resolved: counts.Resolved ?? 0,
    closed: counts.Closed ?? 0,
  });
}
