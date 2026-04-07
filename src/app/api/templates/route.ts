import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Ad zorunludur").max(100),
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(100),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  categoryId: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.ticketTemplate.findMany({
    orderBy: { name: "asc" },
    include: { category: true },
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as unknown;
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Geçersiz veri" },
      { status: 400 }
    );
  }

  const existing = await prisma.ticketTemplate.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Bu isimde bir şablon zaten mevcut" },
      { status: 409 }
    );
  }

  const template = await prisma.ticketTemplate.create({
    data: parsed.data,
    include: { category: true },
  });

  return NextResponse.json(template, { status: 201 });
}
