import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.user.update({ where: { email: "admin@coachflow.app" }, data: { role: "super_admin" } }).then((u) => {
  console.log("Updated:", u.email, u.role);
  prisma.$disconnect();
});
