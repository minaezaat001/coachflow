import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { deriveClientPaymentStatus } from "@/lib/finance";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const where: any = { client: { coachId: user.id } };
    if (clientId) {
      where.clientId = parseInt(clientId);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { client: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المدفوعات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.clientId || data.amount === undefined) {
      return NextResponse.json({ error: "العميل والمبلغ مطلوبان" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: data.clientId, coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const pay = await tx.payment.create({
        data: {
          clientId: data.clientId,
          subscriptionId: data.subscriptionId ? parseInt(data.subscriptionId) : null,
          amount: parseFloat(data.amount),
          amountRemaining: data.amountRemaining !== undefined && data.amountRemaining !== null ? parseFloat(data.amountRemaining) : null,
          status: data.status || "unpaid",
          method: data.method || "cash",
          paidAt: data.paidAt || null,
          notes: data.notes || null,
        },
      });

      const allPayments = await tx.payment.findMany({
        where: { clientId: data.clientId },
      });

      // If payment settles the balance, mark old partial payments as fully paid
      const totalPaid = allPayments
        .filter((p) => p.status !== "unpaid")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const activeSub = await tx.subscription.findFirst({
        where: { clientId: data.clientId, status: "active" },
      });
      const subValue = activeSub?.price || 0;
      if (totalPaid >= subValue && subValue > 0) {
        await tx.payment.updateMany({
          where: { clientId: data.clientId, status: "partial", amountRemaining: { gt: 0 } },
          data: { amountRemaining: 0, status: "paid" },
        });
      }

      const derivedStatus = deriveClientPaymentStatus(allPayments);
      await tx.client.update({
        where: { id: data.clientId },
        data: { paymentStatus: derivedStatus },
      });

      return pay;
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الدفعة" }, { status: 500 });
  }
}
