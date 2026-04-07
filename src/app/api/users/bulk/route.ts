import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.literal("delete"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body: unknown = await request.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });

  // Kendini silmeye çalışıyorsa listeden çıkar
  const ids = parsed.data.ids.filter((id) => id !== session.user.id);
  if (ids.length === 0) return NextResponse.json({ message: "Kendinizi silemezsiniz" }, { status: 400 });

  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ affected: ids.length });
}
