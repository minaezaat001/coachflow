import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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

    const exercises = await prisma.exercise.findMany({
      where: { clientId: parseInt(clientId) },
      orderBy: { loggedAt: "desc" },
    });

    return NextResponse.json({ exercises });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب التمارين" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.clientId || !data.exerciseName || !data.loggedAt) {
      return NextResponse.json({ error: "العميل واسم التمرين والتاريخ مطلوبون" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: data.clientId, coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        clientId: data.clientId,
        exerciseName: data.exerciseName,
        sets: data.sets ? parseInt(data.sets) : null,
        reps: data.reps ? parseInt(data.reps) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        notes: data.notes || null,
        loggedAt: data.loggedAt,
      },
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء التمرين" }, { status: 500 });
  }
}
