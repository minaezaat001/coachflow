import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coachId = searchParams.get("coachId");

    let coach;

    if (coachId) {
      coach = await prisma.user.findUnique({
        where: { id: coachId },
        select: { name: true, whatsapp: true },
      });
    } else {
      coach = await prisma.user.findFirst({
        where: { role: { in: ["super_admin", "coach"] } },
        orderBy: { createdAt: "asc" },
        select: { name: true, whatsapp: true },
      });
    }

    if (!coach) {
      return NextResponse.json({ name: "المدرب", whatsapp: null });
    }

    return NextResponse.json({ name: coach.name || "المدرب", whatsapp: coach.whatsapp || null });
  } catch {
    return NextResponse.json({ name: "المدرب", whatsapp: null });
  }
}
