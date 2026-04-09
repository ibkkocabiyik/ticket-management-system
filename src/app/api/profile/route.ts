import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır").max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  company: z.string().max(100).nullable().optional(),
  image: z.string().url("Geçerli bir URL giriniz").nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır").optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, phone: true, company: true, image: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ message: "Kullanıcı bulunamadı" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  const { name, phone, company, image, currentPassword, newPassword } = parsed.data;

  // Şifre değişikliği isteniyorsa mevcut şifreyi doğrula
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ message: "Mevcut şifrenizi giriniz" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) {
      return NextResponse.json({ message: "Bu hesapta şifre değiştirilemez (OAuth hesabı)" }, { status: 400 });
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Mevcut şifreniz hatalı" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (company !== undefined) updateData.company = company;
  if (image !== undefined) updateData.image = image;
  if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, phone: true, company: true, image: true, createdAt: true },
  });

  return NextResponse.json(updatedUser);
}
