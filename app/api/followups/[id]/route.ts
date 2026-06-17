import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const followup = await prisma.followup.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!followup) {
      return NextResponse.json({ error: "المتابعة غير موجودة" }, { status: 404 });
    }

    const data = await req.json();

    const updated = await prisma.followup.update({
      where: { id },
      data: {
        status: data.status || "COMPLETED",
        completedAt: data.status === "COMPLETED" ? new Date().toISOString() : followup.completedAt,
        notes: data.notes !== undefined ? data.notes : followup.notes,
      },
    });

    return NextResponse.json({ followup: updated });
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث المتابعة" }, { status: 500 });
  }
}
