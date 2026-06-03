import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const followups = await prisma.followup.findMany({
      where: {
        client: { coachId: user.id },
        completed: false,
        scheduledAt: { lte: todayStr },
      },
      include: { client: { select: { id: true, name: true, phone: true, goal: true } } },
      orderBy: [{ scheduledAt: "asc" }, { priority: "desc" }],
    });

    return NextResponse.json({ followups });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب متابعات اليوم" }, { status: 500 });
  }
}
