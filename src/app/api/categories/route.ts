import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),
  description: z.string().max(200).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
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

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Category name already exists" },
      { status: 409 }
    );
  }

  const category = await prisma.category.create({
    data: parsed.data,
  });

  return NextResponse.json(category, { status: 201 });
}
