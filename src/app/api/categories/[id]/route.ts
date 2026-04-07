import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
});

interface Params {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  const updatedCategory = await prisma.category.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(updatedCategory);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  // Check if any tickets are using this category
  const ticketCount = await prisma.ticket.count({
    where: { categoryId: params.id },
  });

  if (ticketCount > 0) {
    return NextResponse.json(
      { message: `Cannot delete category with ${ticketCount} associated tickets` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Category deleted" });
}
