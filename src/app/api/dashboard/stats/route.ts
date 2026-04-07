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
      : {};

  const [total, open, inProgress, waiting, resolved, closed] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: "Open" } }),
    prisma.ticket.count({ where: { ...where, status: "InProgress" } }),
    prisma.ticket.count({ where: { ...where, status: "Waiting" } }),
    prisma.ticket.count({ where: { ...where, status: "Resolved" } }),
    prisma.ticket.count({ where: { ...where, status: "Closed" } }),
  ]);

  return NextResponse.json({ total, open, inProgress, waiting, resolved, closed });
}
