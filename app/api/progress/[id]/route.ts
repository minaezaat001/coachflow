import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const record = await prisma.progress.findFirst({
      where: { id, client: { coachId: user.id } },
      include: { client: { select: { id: true, name: true, coachId: true } } },
    });
    if (!record) {
      return NextResponse.json({ error: "سجل التقدم غير موجود" }, { status: 404 });
    }

    const updated = await prisma.progress.update({
      where: { id },
      data: {
        ...(data.planAction !== undefined && { planAction: data.planAction }),
        ...(data.coachComment !== undefined && { coachComment: data.coachComment }),
        ...(data.weight !== undefined && { weight: data.weight ? parseFloat(data.weight) : null }),
        ...(data.bodyFat !== undefined && { bodyFat: data.bodyFat ? parseFloat(data.bodyFat) : null }),
        ...(data.waist !== undefined && { waist: data.waist ? parseFloat(data.waist) : null }),
        ...(data.chest !== undefined && { chest: data.chest ? parseFloat(data.chest) : null }),
        ...(data.neck !== undefined && { neck: data.neck ? parseFloat(data.neck) : null }),
        ...(data.leg !== undefined && { leg: data.leg ? parseFloat(data.leg) : null }),
        ...(data.arm !== undefined && { arm: data.arm ? parseFloat(data.arm) : null }),
        ...(data.glutes !== undefined && { glutes: data.glutes ? parseFloat(data.glutes) : null }),
        ...(data.frontPhoto !== undefined && { frontPhoto: data.frontPhoto || null }),
        ...(data.sidePhoto !== undefined && { sidePhoto: data.sidePhoto || null }),
        ...(data.backPhoto !== undefined && { backPhoto: data.backPhoto || null }),
        ...(data.inbodyPhoto !== undefined && { inbodyPhoto: data.inbodyPhoto || null }),
      },
    });

    // Auto-calculate next check-in date from current nextCheckInDate or check-in date
    const client = record.client;
    const clientFull = await prisma.client.findUnique({ where: { id: client.id } });
    const frequencyDays = clientFull?.defaultCheckInFrequency || 7;
    const baseDateStr = clientFull?.nextCheckInDate || record.recordedAt;
    const baseDate = new Date(baseDateStr);
    baseDate.setDate(baseDate.getDate() + frequencyDays);
    const nextCheckInDate = baseDate.toISOString().split("T")[0];

    await prisma.client.update({
      where: { id: client.id },
      data: { nextCheckInDate },
    });

    // Create notification for the client
    const coachName = user.name || "كابتن ميكي";
    await prisma.clientNotification.create({
      data: {
        clientId: client.id,
        coachId: user.id,
        title: `${coachName} رد على متابعتك الدورية`,
        message: data.coachComment
          ? `${coachName}: ${data.coachComment}`
          : "افتح الحساب الآن لمعرفة التحديثات!",
      },
    });

    return NextResponse.json({ progress: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث سجل التقدم" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const record = await prisma.progress.findFirst({
      where: { id, client: { coachId: user.id } },
    });
    if (!record) {
      return NextResponse.json({ error: "سجل التقدم غير موجود" }, { status: 404 });
    }

    await prisma.progress.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء حذف سجل التقدم" }, { status: 500 });
  }
}
