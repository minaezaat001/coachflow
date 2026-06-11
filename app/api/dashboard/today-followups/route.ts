import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const clients = await prisma.client.findMany({
      where: {
        coachId: user.id,
        subscriptionStatus: "active",
        nextCheckInDate: { lte: todayStr },
      },
      select: {
        id: true, name: true, phone: true, goal: true,
        nextCheckInDate: true, defaultCheckInFrequency: true,
        subscriptionStatus: true,
      },
      orderBy: { nextCheckInDate: "asc" },
    });

    return NextResponse.json({ followups: clients });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب متابعات اليوم" }, { status: 500 });
  }
}
