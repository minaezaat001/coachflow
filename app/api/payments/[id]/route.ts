import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { deriveClientPaymentStatus } from "@/lib/finance";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const payment = await prisma.payment.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!payment) {
      return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
    }

    const updateData: any = {};
    const allowedFields = ["amount", "amountRemaining", "status", "method", "paidAt", "notes", "subscriptionId"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === "amount" || field === "amountRemaining" ? parseFloat(data[field]) : field === "subscriptionId" ? (data[field] ? parseInt(data[field]) : null) : data[field];
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const pay = await tx.payment.update({
        where: { id },
        data: updateData,
      });

      const allPayments = await tx.payment.findMany({
        where: { clientId: payment.clientId },
      });
      const derivedStatus = deriveClientPaymentStatus(allPayments);
      await tx.client.update({
        where: { id: payment.clientId },
        data: { paymentStatus: derivedStatus },
      });

      return pay;
    });

    return NextResponse.json({ payment: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الدفعة" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const payment = await prisma.payment.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!payment) {
      return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });

      const allPayments = await tx.payment.findMany({
        where: { clientId: payment.clientId },
      });
      const derivedStatus = deriveClientPaymentStatus(allPayments);
      await tx.client.update({
        where: { id: payment.clientId },
        data: { paymentStatus: derivedStatus },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الدفعة" }, { status: 500 });
  }
}
