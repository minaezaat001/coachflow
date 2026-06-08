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
    const allowedFields = ["title", "completed", "priority", "dueDate", "clientId", "repeat"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === "clientId" ? (data[field] ? parseInt(data[field]) : null) : data[field];
      }
    }

    const updated = await prisma.todo.update({ where: { id }, data: updateData });

    // Auto-create next occurrence for recurring tasks when completed
    if (data.completed === true && todo.repeat && todo.repeat !== "none") {
      const today = new Date();
      let nextDate: Date;
      switch (todo.repeat) {
        case "daily": nextDate = new Date(today); nextDate.setDate(nextDate.getDate() + 1); break;
        case "weekly": nextDate = new Date(today); nextDate.setDate(nextDate.getDate() + 7); break;
        case "biweekly": nextDate = new Date(today); nextDate.setDate(nextDate.getDate() + 14); break;
        case "monthly": nextDate = new Date(today); nextDate.setMonth(nextDate.getMonth() + 1); break;
        default: nextDate = new Date(today); nextDate.setDate(nextDate.getDate() + 1);
      }
      await prisma.todo.create({
        data: {
          userId: user.id,
          title: todo.title,
          clientId: todo.clientId,
          priority: todo.priority,
          dueDate: nextDate.toISOString().split("T")[0],
          repeat: todo.repeat,
        },
      });
    }

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
