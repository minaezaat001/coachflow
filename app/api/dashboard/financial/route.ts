import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { calculateCoachFinanceSummary, calculateRevenueByMethod, calculateMonthlyTrend } from "@/lib/finance";

export async function GET() {
  try {
    const user = await requireAuth();

    const payments = await prisma.payment.findMany({
      where: { client: { coachId: user.id } },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "active", client: { coachId: user.id } },
    });

    const finance = calculateCoachFinanceSummary(payments, activeSubs);
    const revenueByMethod = calculateRevenueByMethod(payments);
    const monthlyTrend = calculateMonthlyTrend(payments);

    return NextResponse.json({
      totalRevenue: finance.totalRevenue,
      monthlyRevenue: finance.monthlyRevenue,
      unpaidAmount: finance.outstandingAmount,
      expectedRevenue: finance.expectedRevenue,
      activeSubscriptionRevenue: finance.activeSubscriptionRevenue,
      revenueByMethod,
      monthlyTrend,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب التحليل المالي" }, { status: 500 });
  }
}
