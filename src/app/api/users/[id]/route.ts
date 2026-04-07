import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateUserRoleSchema } from "@/lib/validations/user";

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

  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.id },
    data: { role: parsed.data.role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updatedUser);
}
