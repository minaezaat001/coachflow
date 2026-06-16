import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const where: any = { client: { coachId: user.id } };
    if (clientId) {
      where.clientId = parseInt(clientId);
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: { client: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الاشتراكات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.clientId || !data.type || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: "العميل والنوع وتاريخ البداية والنهاية مطلوبون" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: data.clientId, coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          clientId: data.clientId,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          price: data.price ? Math.round(parseFloat(data.price)) : null,
          status: data.status || "active",
        },
      });

      const allSubs = await tx.subscription.findMany({
        where: { clientId: data.clientId },
      });
      const hasActive = allSubs.some((s) => s.status === "active") || (data.status === "active");
      await tx.client.update({
        where: { id: data.clientId },
        data: {
          subscriptionStatus: hasActive ? "active" : "expired",
          subscriptionType: data.type,
          subscriptionStartDate: data.startDate,
          subscriptionEndDate: data.endDate,
        },
      });

      return sub;
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الاشتراك" }, { status: 500 });
  }
}
