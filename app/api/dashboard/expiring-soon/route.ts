import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

function getCairoToday() {
  const cairo = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return cairo;
}

export async function GET() {
  try {
    const user = await requireAuth();

    const todayStr = getCairoToday();
    const todayDate = new Date(todayStr + "T00:00:00+02:00");
    const weekFromNow = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekEndStr = weekFromNow.toISOString().split("T")[0];

    const clients = await prisma.client.findMany({
      where: {
        coachId: user.id,
        OR: [
          { subscriptionEndDate: { lt: todayStr } },
          { subscriptionEndDate: { gte: todayStr, lte: weekEndStr } },
          { subscriptionEndDate: null, nextCheckInDate: { lt: todayStr } },
        ],
      },
      orderBy: [{ subscriptionEndDate: "asc" }, { nextCheckInDate: "asc" }],
    });

    const mapped = clients.map((c) => {
      let period = "expiring-soon";
      if (c.subscriptionEndDate && c.subscriptionEndDate < todayStr) period = "expired";
      else if (!c.subscriptionEndDate && c.nextCheckInDate && c.nextCheckInDate < todayStr) period = "expired";

      return {
        ...c,
        tags: JSON.parse(c.tags),
        period,
      };
    });

    return NextResponse.json({ clients: mapped });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الاشتركات المنتهية قريباً" }, { status: 500 });
  }
}
