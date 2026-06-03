import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type");
    const completed = searchParams.get("completed");

    const where: any = { client: { coachId: user.id } };
    if (clientId) where.clientId = parseInt(clientId);
    if (type) where.type = type;
    if (completed !== null) where.completed = completed === "true";

    const followups = await prisma.followup.findMany({
      where,
      include: { client: { select: { id: true, name: true, phone: true } } },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json({ followups });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المتابعات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.clientId || !data.scheduledAt) {
      return NextResponse.json({ error: "العميل والتاريخ مطلوبان" }, { status: 400 });
    }

    const clientId = parseInt(data.clientId);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "معرف العميل غير صالح" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: clientId, coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const followup = await prisma.followup.create({
      data: {
        clientId,
        title: data.title || "متابعة",
        type: data.type || "daily",
        priority: data.priority || "medium",
        notes: data.notes || null,
        scheduledAt: data.scheduledAt,
      },
    });

    // Update nextCheckInDate on client based on scheduled date
    await prisma.client.update({
      where: { id: clientId },
      data: { nextCheckInDate: data.scheduledAt },
    });

    // Create in-app notification for the coach
    await createNotification({
      coachId: user.id,
      clientId,
      type: "followup",
      title: "متابعة جديدة",
      message: `لديك متابعة مجدولة مع العميل ${client.name}`,
      targetUrl: `/clients/${clientId}?tab=followups`,
    });

    return NextResponse.json({ followup }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء المتابعة" }, { status: 500 });
  }
}
