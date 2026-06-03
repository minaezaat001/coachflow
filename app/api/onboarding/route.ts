import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification, clientTabUrl } from "@/lib/notifications";

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

    const onboarding = await prisma.onboarding.findMany({
      where: { clientId: parseInt(clientId) },
      orderBy: { submittedAt: "desc" },
    });

    const mapped = onboarding.map((o) => ({
      ...o,
      data: JSON.parse(o.data),
    }));

    return NextResponse.json({ onboarding: mapped });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب بيانات الإعداد" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.clientId) {
      return NextResponse.json({ error: "معرف العميل مطلوب" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const onboarding = await prisma.onboarding.create({
      data: {
        clientId: data.clientId,
        data: JSON.stringify(data.data || {}),
      },
    });

    await prisma.client.update({
      where: { id: data.clientId },
      data: { onboarded: true },
    });

    await createNotification({
      coachId: client.coachId,
      clientId: client.id,
      clientName: client.name,
      type: "onboarding",
      title: `بيانات تسجيل جديدة من ${client.name}`,
      message: "قام العميل بتعبئة استمارة البيانات الأولية",
      targetUrl: clientTabUrl(client.id, "onboarding"),
    });

    return NextResponse.json({
      onboarding: { ...onboarding, data: JSON.parse(onboarding.data) },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ بيانات الإعداد" }, { status: 500 });
  }
}
