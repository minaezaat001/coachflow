import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification, clientTabUrl } from "@/lib/notifications";

async function resolveClientAuthorized(clientId: number, token?: string | null) {
  if (token) {
    return prisma.client.findUnique({ where: { uniqueToken: token } });
  }
  const user = await requireAuth();
  return prisma.client.findFirst({ where: { id: clientId, coachId: user.id } });
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "معرف العميل مطلوب" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: parseInt(clientId), coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const progress = await prisma.progress.findMany({
      where: { clientId: parseInt(clientId) },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب التقدم" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.clientId || !data.recordedAt) {
      return NextResponse.json({ error: "العميل والتاريخ مطلوبان" }, { status: 400 });
    }

    if (!data.token) {
      try { await requireAuth(); } catch { return NextResponse.json({ error: "غير مصرح" }, { status: 401 }); }
    }
    const client = await resolveClientAuthorized(data.clientId, data.token);
    if (!client || (data.token && client.id !== data.clientId)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const progress = await prisma.progress.create({
      data: {
        clientId: data.clientId,
        weight: data.weight ? parseFloat(data.weight) : null,
        bodyFat: data.bodyFat ? parseFloat(data.bodyFat) : null,
        waist: data.waist ? parseFloat(data.waist) : null,
        chest: data.chest ? parseFloat(data.chest) : null,
        neck: data.neck ? parseFloat(data.neck) : null,
        leg: data.leg ? parseFloat(data.leg) : null,
        arm: data.arm ? parseFloat(data.arm) : null,
        glutes: data.glutes ? parseFloat(data.glutes) : null,
        adherence: data.adherence ? parseInt(data.adherence) : null,
        notes: data.notes || null,
        planFeedback: data.planFeedback || null,
        improvementsView: data.improvementsView || null,
        frontPhoto: data.frontPhoto || null,
        sidePhoto: data.sidePhoto || null,
        backPhoto: data.backPhoto || null,
        inbodyPhoto: data.inbodyPhoto || null,
        recordedAt: data.recordedAt,
      },
    });

    if (data.weight) {
      await prisma.client.update({
        where: { id: data.clientId },
        data: { weight: parseFloat(data.weight) },
      });
    }

    await createNotification({
      coachId: client.coachId,
      clientId: client.id,
      clientName: client.name,
      type: "checkin",
      title: `نتائج جديدة من ${client.name}`,
      message: "قام العميل بتسجيل نتائج جديدة",
      targetUrl: clientTabUrl(client.id, "progress"),
    });

    return NextResponse.json({ progress }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء سجل التقدم" }, { status: 500 });
  }
}
