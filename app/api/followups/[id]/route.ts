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

    // Advance nextCheckInDate so the overdue endpoint doesn't recreate a followup
    if (data.status === "COMPLETED") {
      const client = await prisma.client.findUnique({ where: { id: followup.clientId } });
      if (client) {
        const freq = client.defaultCheckInFrequency || 7;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + freq);
        await prisma.client.update({
          where: { id: client.id },
          data: { nextCheckInDate: nextDate.toISOString().split("T")[0] },
        });
      }
    }

    return NextResponse.json({ followup: updated });
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث المتابعة" }, { status: 500 });
  }
}
