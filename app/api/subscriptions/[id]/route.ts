import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const subscription = await prisma.subscription.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!subscription) {
      return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    }

    const updateData: any = {};
    const allowedFields = ["type", "startDate", "endDate", "price", "status"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === "price" ? parseFloat(data[field]) : data[field];
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id },
        data: updateData,
      });

      if (data.status !== undefined) {
        const allSubs = await tx.subscription.findMany({
          where: { clientId: subscription.clientId },
        });
        const hasActive = allSubs.some((s) => s.status === "active");
        await tx.client.update({
          where: { id: subscription.clientId },
          data: { subscriptionStatus: hasActive ? "active" : "expired" },
        });
      }

      return sub;
    });

    return NextResponse.json({ subscription: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الاشتراك" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const subscription = await prisma.subscription.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!subscription) {
      return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    }

    await prisma.subscription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الاشتراك" }, { status: 500 });
  }
}
