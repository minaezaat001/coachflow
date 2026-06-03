import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const todo = await prisma.todo.findFirst({ where: { id, userId: user.id } });
    if (!todo) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
    }

    const updateData: any = {};
    const allowedFields = ["title", "completed", "priority", "dueDate", "clientId"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === "clientId" ? (data[field] ? parseInt(data[field]) : null) : data[field];
      }
    }

    const updated = await prisma.todo.update({ where: { id }, data: updateData });
    return NextResponse.json({ todo: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث المهمة" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const todo = await prisma.todo.findFirst({ where: { id, userId: user.id } });
    if (!todo) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
    }

    await prisma.todo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف المهمة" }, { status: 500 });
  }
}
