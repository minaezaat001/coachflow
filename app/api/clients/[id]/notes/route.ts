import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const existing = await prisma.client.findFirst({ where: { id, coachId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        notes: data.notes !== undefined ? data.notes : existing.notes,
        dietPlanUrl: data.dietPlanUrl !== undefined ? data.dietPlanUrl : existing.dietPlanUrl,
        workoutPlanUrl: data.workoutPlanUrl !== undefined ? data.workoutPlanUrl : existing.workoutPlanUrl,
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الملاحظات" }, { status: 500 });
  }
}
