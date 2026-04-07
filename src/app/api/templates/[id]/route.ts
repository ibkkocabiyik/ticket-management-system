import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().min(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as unknown;
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Geçersiz veri" },
      { status: 400 }
    );
  }

  const template = await prisma.ticketTemplate.update({
    where: { id },
    data: parsed.data,
    include: { category: true },
  });

  return NextResponse.json(template);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.ticketTemplate.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
