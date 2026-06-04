import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { name: "ميكي" } });
  if (!user) {
    console.log("User with name 'ميكي' not found.");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: "المدير" },
  });

  console.log(`Renamed user ${user.email} from 'ميكي' to 'المدير'`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
