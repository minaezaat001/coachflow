import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const log = await prisma.workoutLog.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!log) {
      return NextResponse.json({ error: "سجل التمرين غير موجود" }, { status: 404 });
    }

    await prisma.workoutLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف سجل التمرين" }, { status: 500 });
  }
}
