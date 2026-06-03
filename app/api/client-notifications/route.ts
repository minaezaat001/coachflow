import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "الرمز مطلوب" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { uniqueToken: token } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const notifications = await prisma.clientNotification.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الإشعارات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      await requireAuth();
      const data = await req.json();
      if (!data.clientId || !data.title) {
        return NextResponse.json({ error: "العميل والعنوان مطلوبان" }, { status: 400 });
      }
      const notification = await prisma.clientNotification.create({
        data: {
          clientId: data.clientId,
          title: data.title,
          message: data.message || null,
          coachId: data.coachId || null,
        },
      });
      return NextResponse.json({ notification }, { status: 201 });
    }

    const client = await prisma.client.findUnique({ where: { uniqueToken: token } });
    if (!client) {
      return NextResponse.json({ error: "الرمز غير صالح" }, { status: 401 });
    }

    const data = await req.json();
    if (!data.title) {
      return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
    }

    const notification = await prisma.clientNotification.create({
      data: {
        clientId: client.id,
        title: data.title,
        message: data.message || null,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "فشل إنشاء الإشعار" }, { status: 500 });
  }
}
