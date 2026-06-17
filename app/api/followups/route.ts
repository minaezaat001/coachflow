import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const overdue = searchParams.get("overdue") === "true";

    if (overdue) {
      const today = new Date().toISOString().split("T")[0];

      const activeClients = await prisma.client.findMany({
        where: { coachId: user.id, subscriptionEndDate: { gte: today } },
        select: { id: true, name: true, nextCheckInDate: true, subscriptionEndDate: true },
      });

      const overdueClients = activeClients.filter((c) => c.nextCheckInDate && c.nextCheckInDate < today);

      for (const c of overdueClients) {
        const existing = await prisma.followup.findFirst({
          where: { clientId: c.id, scheduledDate: c.nextCheckInDate!, status: "PENDING" },
        });
        if (!existing) {
          await prisma.followup.create({
            data: { clientId: c.id, scheduledDate: c.nextCheckInDate! },
          });
        }
      }

      const followups = await prisma.followup.findMany({
        where: { client: { coachId: user.id }, status: "PENDING" },
        include: { client: { select: { id: true, name: true, phone: true } } },
        orderBy: { scheduledDate: "asc" },
      });

      return NextResponse.json({ followups });
    }

    const where: any = { client: { coachId: user.id } };
    if (clientId) where.clientId = parseInt(clientId);

    const followups = await prisma.followup.findMany({
      where,
      include: { client: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ followups });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب المتابعات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.clientId || !data.scheduledDate) {
      return NextResponse.json({ error: "العميل وتاريخ المتابعة مطلوبان" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: data.clientId, coachId: user.id } });
    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const followup = await prisma.followup.create({
      data: {
        clientId: data.clientId,
        scheduledDate: data.scheduledDate,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ followup }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "فشل إنشاء المتابعة" }, { status: 500 });
  }
}
