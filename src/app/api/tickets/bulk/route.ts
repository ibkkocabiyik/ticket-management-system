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
  const historyAction = action === "status" ? "status_changed" : "priority_changed";
  const historyField = action === "status" ? "Durum" : "Öncelik";
  const value = parsed.data.value;

  const STATUS_TR: Record<string, string> = {
    Open: "Açık", InProgress: "Devam Ediyor", Waiting: "Beklemede", Resolved: "Çözüldü", Closed: "Kapatıldı",
  };
  const PRIORITY_TR: Record<string, string> = {
    Low: "Düşük", Normal: "Normal", High: "Yüksek", Urgent: "Acil",
  };
  const translate = (v: string) => (action === "status" ? STATUS_TR[v] : PRIORITY_TR[v]) ?? v;

  const tickets = await prisma.ticket.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, priority: true },
  });

  await prisma.ticket.updateMany({
    where: { id: { in: ids } },
    data: { [field]: value, updatedAt: new Date() },
  });

  await prisma.ticketHistory.createMany({
    data: tickets.map((t) => ({
      ticketId: t.id,
      userId: session.user.id,
      action: historyAction,
      field: historyField,
      oldValue: translate(field === "status" ? t.status : t.priority),
      newValue: translate(value),
    })),
  });

  return NextResponse.json({ affected: ids.length });
}
