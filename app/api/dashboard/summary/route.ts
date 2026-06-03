import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { calculateCoachFinanceSummary } from "@/lib/finance";

export async function GET() {
  try {
    const user = await requireAuth();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const clients = await prisma.client.findMany({ where: { coachId: user.id } });
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.subscriptionStatus === "active").length;
    const expiredClients = clients.filter((c) => c.subscriptionStatus === "expired").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const pendingFollowups = await prisma.followup.count({
      where: {
        completed: false,
        scheduledAt: { lte: todayStr },
        client: { coachId: user.id },
      },
    });

    const payments = await prisma.payment.findMany({
      where: { client: { coachId: user.id } },
    });

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "active", client: { coachId: user.id } },
    });

    const finance = calculateCoachFinanceSummary(payments, activeSubs);

    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const expiringThisWeek = clients.filter(
      (c) => c.subscriptionEndDate && c.subscriptionEndDate <= weekFromNow && c.subscriptionEndDate >= now.toISOString().split("T")[0]
    ).length;

    const newClientsThisMonth = clients.filter(
      (c) => c.createdAt >= new Date(startOfMonth) && c.createdAt <= new Date(endOfMonth)
    ).length;

    return NextResponse.json({
      totalClients,
      activeClients,
      expiredClients,
      pendingFollowups,
      totalRevenue: finance.totalRevenue,
      unpaidAmount: finance.outstandingAmount,
      expectedRevenue: finance.expectedRevenue,
      expiringThisWeek,
      newClientsThisMonth,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب ملخص لوحة التحكم" }, { status: 500 });
  }
}
