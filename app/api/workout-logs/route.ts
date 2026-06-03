import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification, clientTabUrl } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "معرف العميل مطلوب" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: parseInt(clientId), coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const workoutLogs = await prisma.workoutLog.findMany({
      where: { clientId: parseInt(clientId) },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ workoutLogs });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب سجلات التمرين" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.clientId || !data.exerciseName || !data.date) {
      return NextResponse.json({ error: "العميل واسم التمرين والتاريخ مطلوبون" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const workoutLog = await prisma.workoutLog.create({
      data: {
        clientId: data.clientId,
        exerciseName: data.exerciseName,
        sets: data.sets || null,
        reps: data.reps ? parseInt(data.reps) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        notes: data.notes || null,
        date: data.date,
      },
    });

    await createNotification({
      coachId: client.coachId,
      clientId: client.id,
      clientName: client.name,
      type: "workout",
      title: `تمارين جديدة من ${client.name}`,
      message: `سجل ${client.name} تمرين ${data.exerciseName}`,
      targetUrl: clientTabUrl(client.id, "exercises"),
    });

    return NextResponse.json({ workoutLog }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء سجل التمرين" }, { status: 500 });
  }
}
