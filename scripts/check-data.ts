import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const coaches = await prisma.user.findMany({
    where: { role: { in: ["super_admin", "coach"] } },
    select: { id: true, name: true, email: true },
  });
  console.log("Coaches:", JSON.stringify(coaches, null, 2));

  const packages = await prisma.package.findMany({
    select: { id: true, name: true, coachId: true, isActive: true },
  });
  console.log("Packages:", JSON.stringify(packages, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
