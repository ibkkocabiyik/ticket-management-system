import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: params.id },
  });

  if (!notification) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (notification.userId !== session.user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
}
