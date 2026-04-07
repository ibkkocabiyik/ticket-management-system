import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface Params {
  params: { id: string };
}

const updateUserSchema = z.object({
  role: z.enum(["Admin", "SupportTeam", "EndUser"]).optional(),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır").max(100).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ message: "Kullanıcı bulunamadı" }, { status: 404 });

  const updatedUser = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(updatedUser);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (session.user.id === params.id) return NextResponse.json({ message: "Kendinizi silemezsiniz" }, { status: 400 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
