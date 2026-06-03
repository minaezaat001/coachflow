import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const followup = await prisma.followup.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!followup) {
      return NextResponse.json({ error: "المتابعة غير موجودة" }, { status: 404 });
    }

    const updateData: any = {};
    const allowedFields = ["title", "type", "priority", "notes", "completed", "scheduledAt", "completedAt"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updated = await prisma.followup.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ followup: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث المتابعة" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const followup = await prisma.followup.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!followup) {
      return NextResponse.json({ error: "المتابعة غير موجودة" }, { status: 404 });
    }

    await prisma.followup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف المتابعة" }, { status: 500 });
  }
}
