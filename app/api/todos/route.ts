import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const completed = searchParams.get("completed");

    const where: any = { userId: user.id };
    if (date) where.dueDate = date;
    if (completed !== null) where.completed = completed === "true";

    const todos = await prisma.todo.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json({ todos });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المهام" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.title) {
      return NextResponse.json({ error: "عنوان المهمة مطلوب" }, { status: 400 });
    }

    const todo = await prisma.todo.create({
      data: {
        userId: user.id,
        title: data.title,
        clientId: data.clientId ? parseInt(data.clientId) : null,
        priority: data.priority || "medium",
        dueDate: data.dueDate || null,
        repeat: data.repeat || "none",
      },
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء المهمة" }, { status: 500 });
  }
}
