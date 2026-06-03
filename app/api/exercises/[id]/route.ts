import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const exercise = await prisma.exercise.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!exercise) {
      return NextResponse.json({ error: "التمرين غير موجود" }, { status: 404 });
    }

    const updateData: any = {};
    const allowedFields = ["exerciseName", "sets", "reps", "weight", "notes", "loggedAt"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === "sets" || field === "reps" ? parseInt(data[field]) : field === "weight" ? parseFloat(data[field]) : data[field];
      }
    }

    const updated = await prisma.exercise.update({ where: { id }, data: updateData });
    return NextResponse.json({ exercise: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث التمرين" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const exercise = await prisma.exercise.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!exercise) {
      return NextResponse.json({ error: "التمرين غير موجود" }, { status: 404 });
    }

    await prisma.exercise.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف التمرين" }, { status: 500 });
  }
}
