import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { parseTags } from "@/lib/utils";
import { calculateClientFinance } from "@/lib/finance";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const client = await prisma.client.findFirst({
      where: { id, coachId: user.id },
      include: { package: { select: { id: true, name: true, price: true, durationMonths: true, packageType: true } } },
    });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const [payments, subscriptions] = await Promise.all([
      prisma.payment.findMany({ where: { clientId: id } }),
      prisma.subscription.findMany({ where: { clientId: id } }),
    ]);

    const finance = calculateClientFinance(payments, subscriptions);

    return NextResponse.json({
      client: { ...client, tags: parseTags(client.tags) },
      finance,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب العميل" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const existing = await prisma.client.findFirst({ where: { id, coachId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const updateData: any = {};
    const allowedFields = ["name", "phone", "goal", "weight", "height", "notes", "dietPlanUrl", "workoutPlanUrl", "subscriptionType", "subscriptionStartDate", "subscriptionEndDate", "subscriptionStatus", "paymentStatus", "commitmentScore", "onboarded", "defaultCheckInFrequency", "nextCheckInDate", "packageId"];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === "weight" || field === "height" || field === "commitmentScore" ? (data[field] !== null ? parseFloat(data[field]) : null) : data[field];
      }
    }

    // Auto-calculate subscription dates + financial settlement when package changes
    if (data.packageId !== undefined && data.packageId) {
      const pkg = await prisma.package.findFirst({ where: { id: parseInt(data.packageId), coachId: user.id } });
      if (pkg) {
        const startDate = data.subscriptionStartDate || existing.subscriptionStartDate || new Date().toISOString().split("T")[0];
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + pkg.durationMonths);
        updateData.subscriptionStartDate = startDate;
        updateData.subscriptionEndDate = end.toISOString().split("T")[0];
        updateData.subscriptionStatus = "active";
        updateData.defaultCheckInFrequency = pkg.defaultCheckInFrequency;
        // Next check-in based on new frequency
        const nextCheckIn = new Date();
        nextCheckIn.setDate(nextCheckIn.getDate() + pkg.defaultCheckInFrequency);
        updateData.nextCheckInDate = nextCheckIn.toISOString().split("T")[0];

        // Financial settlement: recalc remaining = new package price - total paid so far
        const payments = await prisma.payment.findMany({ where: { clientId: id } });
        const totalPaid = payments.reduce((sum, p) => sum + (p.status === "paid" || p.status === "partial" ? p.amount : 0), 0);
        const newRemaining = Math.max(0, pkg.price - totalPaid);
        // Create/update a subscription record with the new price
        const activeSub = await prisma.subscription.findFirst({ where: { clientId: id, status: "active" } });
        if (activeSub) {
          await prisma.subscription.update({
            where: { id: activeSub.id },
            data: { price: pkg.price, type: pkg.packageType, startDate, endDate: end.toISOString().split("T")[0] },
          });
        } else {
          await prisma.subscription.create({
            data: { clientId: id, type: pkg.packageType, startDate, endDate: end.toISOString().split("T")[0], price: pkg.price, status: "active" },
          });
        }
        // Update payment status based on remaining balance
        if (newRemaining <= 0) {
          updateData.paymentStatus = "paid";
        } else if (totalPaid > 0) {
          updateData.paymentStatus = "partial";
        }
      }
    }

    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags);
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ client: { ...client, tags: parseTags(client.tags) } });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث العميل" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const existing = await prisma.client.findFirst({ where: { id, coachId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف العميل" }, { status: 500 });
  }
}
