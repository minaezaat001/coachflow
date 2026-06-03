import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const coach = await prisma.user.findFirst({
      where: { role: { in: ["super_admin", "coach"] }, suspended: false },
      orderBy: { createdAt: "asc" },
      select: { name: true, whatsapp: true },
    });

    if (!coach) {
      return NextResponse.json({ name: "المدرب", whatsapp: null });
    }

    return NextResponse.json({ name: coach.name || "المدرب", whatsapp: coach.whatsapp || null });
  } catch {
    return NextResponse.json({ name: "المدرب", whatsapp: null });
  }
}
