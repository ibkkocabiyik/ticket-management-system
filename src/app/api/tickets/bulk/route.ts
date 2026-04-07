import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bulkSchema = z.union([
  z.object({
    ids: z.array(z.string()).min(1),
    action: z.literal("delete"),
  }),
  z.object({
    ids: z.array(z.string()).min(1),
    action: z.literal("status"),
    value: z.enum(["Open", "InProgress", "Waiting", "Resolved", "Closed"]),
  }),
  z.object({
    ids: z.array(z.string()).min(1),
    action: z.literal("priority"),
    value: z.enum(["Low", "Normal", "High", "Urgent"]),
  }),
]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
  }

  const { ids, action } = parsed.data;

  if (action === "delete") {
    await prisma.ticket.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ affected: ids.length });
  }

  const field = action === "status" ? "status" : "priority";
  const value = parsed.data.value;

  // Mevcut ticket değerlerini al (history için)
  const tickets = await prisma.ticket.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, priority: true },
  });

  await prisma.ticket.updateMany({
    where: { id: { in: ids } },
    data: { [field]: value, updatedAt: new Date() },
  });

  // Her ticket için history kaydı yaz
  await prisma.ticketHistory.createMany({
    data: tickets.map((t) => ({
      ticketId: t.id,
      userId: session.user.id,
      action: "updated",
      field,
      oldValue: field === "status" ? t.status : t.priority,
      newValue: value,
    })),
  });

  return NextResponse.json({ affected: ids.length });
}
