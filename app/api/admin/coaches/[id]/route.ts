import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    if (body.suspended !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { suspended: body.suspended },
      });
      return NextResponse.json({ success: true, suspended: body.suspended });
    }

    if (body.name || body.email) {
      const updateData: Record<string, string> = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email;
      if (body.role) updateData.role = body.role;
      await prisma.user.update({ where: { id }, data: updateData });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const coach = await prisma.user.findUnique({ where: { id } });
    if (!coach) {
      return NextResponse.json({ error: "المدرب غير موجود" }, { status: 404 });
    }
    if (coach.role === "super_admin") {
      return NextResponse.json({ error: "لا يمكن حذف حساب المالك" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  }
}
