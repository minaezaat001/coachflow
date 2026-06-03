import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const notification = await prisma.clientNotification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: "الإشعار غير موجود" }, { status: 404 });
    }

    if (token) {
      const client = await prisma.client.findUnique({ where: { uniqueToken: token } });
      if (!client || client.id !== notification.clientId) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
    }

    const updated = await prisma.clientNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الإشعار" }, { status: 500 });
  }
}
