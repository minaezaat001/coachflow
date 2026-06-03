import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
    const updated = await prisma.user.update({ where: { id: user.id }, data: updateData });
    return NextResponse.json({ user: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الملف الشخصي" }, { status: 500 });
  }
}
