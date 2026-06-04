import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "miki@coachflow.app";
  const password = "Miki@Admin2026";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, passwordHash: hash, name: "المدير", role: "super_admin" },
  });

  console.log("super_admin created:", email);
  console.log("Password:", password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
