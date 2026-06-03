import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@coachflow.app";
  const password = "admin123";
  const name = "المدرب";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "super_admin") {
      await prisma.user.update({
        where: { email },
        data: { role: "super_admin" },
      });
      console.log("Admin user upgraded to super_admin:", email);
    } else {
      console.log("Admin user already exists:", email);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: "super_admin" },
  });

  console.log("Admin user created:", { email: user.email, password, role: user.role });
  console.log("Log in at http://localhost:3000/login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
