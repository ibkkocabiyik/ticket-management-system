import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Geçersiz form verisi" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const ticketId = formData.get("ticketId") as string | null;
  const commentId = formData.get("commentId") as string | null;

  if (!file) {
    return NextResponse.json({ message: "Dosya bulunamadı" }, { status: 400 });
  }
  if (!ticketId && !commentId) {
    return NextResponse.json({ message: "ticketId veya commentId gereklidir" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ message: "Desteklenmeyen dosya tipi. İzin verilenler: resim, PDF, txt" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Dosya boyutu 5MB'yi aşamaz" }, { status: 400 });
  }

  // Sahiplik doğrulama
  if (ticketId) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return NextResponse.json({ message: "Talep bulunamadı" }, { status: 404 });
    if (session.user.role === "EndUser" && ticket.creatorId !== session.user.id) {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }
  }
  if (commentId) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return NextResponse.json({ message: "Yorum bulunamadı" }, { status: 404 });
    if (session.user.role === "EndUser" && comment.authorId !== session.user.id) {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }
  }

  // Dosyayı diske yaz
  const originalExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const storedName = `${crypto.randomUUID()}.${originalExt}`;
  const filePath = join(UPLOAD_DIR, storedName);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      url: `/uploads/${storedName}`,
      ...(ticketId ? { ticketId } : {}),
      ...(commentId ? { commentId } : {}),
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
