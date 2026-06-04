import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coachId = searchParams.get("coachId");

    let whereCoachId: string | undefined;

    if (coachId) {
      whereCoachId = coachId;
    } else {
      const coach = await prisma.user.findFirst({
        where: { role: { in: ["super_admin", "coach"] } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (coach) whereCoachId = coach.id;
    }

    if (!whereCoachId) {
      return NextResponse.json({ packages: [] });
    }

    const packages = await prisma.package.findMany({
      where: { isActive: true, coachId: whereCoachId },
      select: { id: true, name: true, price: true, durationMonths: true, packageType: true, defaultCheckInFrequency: true, description: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ packages });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الباقات" }, { status: 500 });
  }
}
