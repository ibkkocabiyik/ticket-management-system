import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role === "EndUser") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: "SupportTeam", id: { not: session.user.id } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
