import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const history = await prisma.ticketHistory.findMany({
    where: { ticketId: params.id },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(history);
}
