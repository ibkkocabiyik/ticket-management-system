import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "demo@demo.com" } });
  if (existing) {
    console.log("Demo kullanıcı zaten mevcut:", existing.email);
    return;
  }

  const password = await bcryptjs.hash("demo123", 10);
  const user = await prisma.user.create({
    data: { email: "demo@demo.com", name: "Demo Kullanıcı", password, role: "EndUser" },
  });
  console.log("Demo kullanıcı oluşturuldu:", user.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
