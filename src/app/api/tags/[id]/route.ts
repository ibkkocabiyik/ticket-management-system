import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const tag = await prisma.tag.findUnique({ where: { id: params.id } });
  if (!tag) {
    return NextResponse.json({ message: "Tag not found" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
