import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];
    const weekEndStr = weekFromNow.toISOString().split("T")[0];

    const clients = await prisma.client.findMany({
      where: {
        coachId: user.id,
        subscriptionEndDate: {
          gte: todayStr,
          lte: weekEndStr,
        },
      },
      orderBy: { subscriptionEndDate: "asc" },
    });

    const mapped = clients.map((c) => ({
      ...c,
      tags: JSON.parse(c.tags),
    }));

    return NextResponse.json({ clients: mapped });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الاشتركات المنتهية قريباً" }, { status: 500 });
  }
}
