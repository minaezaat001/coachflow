import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const clientId = parseInt((await params).id);

    const client = await prisma.client.findFirst({ where: { id: clientId, coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const [followups, payments, subscriptions, progress] = await Promise.all([
      prisma.followup.findMany({ where: { clientId } }),
      prisma.payment.findMany({ where: { clientId } }),
      prisma.subscription.findMany({ where: { clientId } }),
      prisma.progress.findMany({ where: { clientId } }),
    ]);

    const timeline: any[] = [];

    followups.forEach((f) => {
      timeline.push({
        id: `followup-${f.id}`,
        type: "followup",
        title: f.type === "phone" ? "متابعة هاتفية" : f.type === "visit" ? "زيارة" : "متابعة يومية",
        description: f.notes || "",
        date: f.scheduledAt,
        completed: f.completed,
      });
    });

    payments.forEach((p) => {
      timeline.push({
        id: `payment-${p.id}`,
        type: "payment",
        title: `دفعة - ${p.amount} جنيه`,
        description: `طريقة الدفع: ${p.method} - الحالة: ${p.status}`,
        date: p.paidAt || p.createdAt.toISOString(),
      });
    });

    subscriptions.forEach((s) => {
      timeline.push({
        id: `subscription-${s.id}`,
        type: "subscription",
        title: `اشتراك ${s.type}`,
        description: `من ${s.startDate} إلى ${s.endDate}`,
        date: s.startDate,
        status: s.status,
      });
    });

    progress.forEach((p) => {
      timeline.push({
        id: `progress-${p.id}`,
        type: "progress",
        title: "قياسات جديدة",
        description: `الوزن: ${p.weight || "-"} - الدهون: ${p.bodyFat || "-"}% - الخصر: ${p.waist || "-"}`,
        date: p.recordedAt,
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ timeline });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الخط الزمني" }, { status: 500 });
  }
}
