import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId مطلوب" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { id: parseInt(clientId), coachId: user.id },
    });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const files = await prisma.clientFile.findMany({
      where: { clientId: parseInt(clientId) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الملفات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.clientId || !data.url || !data.name) {
      return NextResponse.json({ error: "clientId و url و name مطلوبون" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { id: parseInt(data.clientId), coachId: user.id },
    });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const file = await prisma.clientFile.create({
      data: {
        clientId: parseInt(data.clientId),
        name: data.name,
        url: data.url,
        type: data.type || "other",
      },
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ الملف" }, { status: 500 });
  }
}
