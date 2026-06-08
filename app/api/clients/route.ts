import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { parseTags, tagsToString } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const statusFilter = searchParams.get("status");
    const goal = searchParams.get("goal");
    const tag = searchParams.get("tag");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const where: any = { coachId: user.id };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (goal && goal !== "all") {
      where.goal = goal;
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    if (statusFilter && statusFilter !== "all") {
      const now = new Date().toISOString().split("T")[0];
      if (statusFilter === "active") {
        where.subscriptionStatus = { not: "pending" };
        where.AND = [
          { OR: [
            { subscriptionEndDate: { gte: now } },
            { subscriptionEndDate: null },
          ]},
        ];
      } else if (statusFilter === "expired") {
        where.subscriptionEndDate = { lt: now };
      } else if (statusFilter === "pending") {
        where.subscriptionStatus = "pending";
      }
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    const mapped = clients.map((c) => ({
      ...c,
      tags: parseTags(c.tags),
    }));

    return NextResponse.json({
      clients: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب العملاء" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const [user, data] = await Promise.all([
      requireAuth(),
      req.json(),
    ]);

    if (!data.name || !data.phone || !data.goal) {
      return NextResponse.json({ error: "الاسم ورقم الهاتف والهدف مطلوبون" }, { status: 400 });
    }

    const uniqueToken = crypto.randomBytes(16).toString("hex");

    const clientData: any = {
      coachId: user.id,
      name: data.name,
      phone: data.phone,
      goal: data.goal,
      weight: data.weight ? parseFloat(data.weight) : null,
      height: data.height ? parseFloat(data.height) : null,
      tags: data.tags ? tagsToString(data.tags) : "[]",
      notes: data.notes || null,
      dietPlanUrl: data.dietPlanUrl || null,
      workoutPlanUrl: data.workoutPlanUrl || null,
      subscriptionType: data.subscriptionType || null,
      subscriptionStartDate: data.subscriptionStartDate || null,
      subscriptionEndDate: data.subscriptionEndDate || null,
      subscriptionStatus: data.subscriptionType ? "active" : "pending",
      paymentStatus: data.paymentStatus || "unpaid",
      packageId: data.packageId ? parseInt(data.packageId) : null,
      defaultCheckInFrequency: data.defaultCheckInFrequency ? parseInt(data.defaultCheckInFrequency) : null,
      uniqueToken,
    };

    // Auto-calculate nextCheckInDate from subscription start date + check-in frequency
    if (data.subscriptionStartDate && data.defaultCheckInFrequency) {
      const startDate = new Date(data.subscriptionStartDate);
      const nextDate = new Date(startDate);
      nextDate.setDate(nextDate.getDate() + parseInt(data.defaultCheckInFrequency));
      clientData.nextCheckInDate = nextDate.toISOString().split("T")[0];
    }

    const client = await prisma.client.create({ data: clientData });

    if (data.subscriptionType && data.subscriptionStartDate && data.subscriptionEndDate) {
      await prisma.subscription.create({
        data: {
          clientId: client.id,
          type: data.subscriptionType,
          startDate: data.subscriptionStartDate,
          endDate: data.subscriptionEndDate,
          price: data.subscriptionPrice ? Math.round(parseFloat(data.subscriptionPrice)) : null,
          status: "active",
        },
      });
    }

    if (data.paymentAmount) {
      const paymentStatus = data.paymentStatus || "unpaid";
      await prisma.payment.create({
        data: {
          clientId: client.id,
          amount: parseFloat(data.paymentAmount),
          status: paymentStatus,
          method: data.paymentMethod || "cash",
          paidAt: data.paidAt || null,
        },
      });

      if (paymentStatus !== "unpaid") {
        await prisma.client.update({
          where: { id: client.id },
          data: { paymentStatus },
        });
      }
    }

    await createNotification({
      coachId: user.id,
      clientId: client.id,
      clientName: client.name,
      type: "onboarding",
      title: `عميل جديد: ${client.name}`,
      message: `تم تسجيل عميل جديد — ${data.goal}`,
      targetUrl: `/clients/${client.id}`,
    });

    return NextResponse.json({ client: { ...client, tags: parseTags(client.tags) } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء العميل" }, { status: 500 });
  }
}
