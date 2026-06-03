import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const totalCoaches = await prisma.user.count();
    const activeCoaches = await prisma.user.count({ where: { suspended: false } });
    const totalClients = await prisma.client.count();

    const payments = await prisma.payment.findMany({
      where: { status: { not: "unpaid" } },
      select: { amount: true, status: true },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      totalCoaches,
      activeCoaches,
      suspendedCoaches: totalCoaches - activeCoaches,
      totalClients,
      totalRevenue,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
