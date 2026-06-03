import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    const clients = await prisma.client.findMany({
      where: { coachId: user.id },
      include: {
        progress: {
          orderBy: { recordedAt: "desc" },
          take: 1,
          select: { recordedAt: true },
        },
      },
    });

    const mapped = clients.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      goal: c.goal,
      subscriptionStatus: c.subscriptionStatus,
      nextCheckInDate: c.nextCheckInDate,
      defaultCheckInFrequency: c.defaultCheckInFrequency,
      lastCheckInDate: c.progress[0]?.recordedAt || null,
    }));

    return NextResponse.json({ clients: mapped });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب بيانات المتابعات" }, { status: 500 });
  }
}
