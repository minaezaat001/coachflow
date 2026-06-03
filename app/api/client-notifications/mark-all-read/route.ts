import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const clientId = searchParams.get("clientId");

    let where: any = {};
    if (token) {
      const client = await prisma.client.findUnique({ where: { uniqueToken: token } });
      if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
      where.clientId = client.id;
    } else if (clientId) {
      where.clientId = parseInt(clientId);
    } else {
      return NextResponse.json({ error: "الرمز أو معرف العميل مطلوب" }, { status: 400 });
    }

    await prisma.clientNotification.updateMany({
      where: { ...where, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الإشعارات" }, { status: 500 });
  }
}
