import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const coaches = await prisma.user.findMany({
      where: { role: { in: ["super_admin", "coach"] } },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ coaches });
  } catch {
    return NextResponse.json({ coaches: [] });
  }
}
