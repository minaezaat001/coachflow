import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await requireAuth();
    const leads = await prisma.lead.findMany({
      where: { coachId: user.id },
      include: { package: { select: { id: true, name: true, price: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب طلبات الاشتراك" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: "الاسم ورقم الهاتف مطلوبان" }, { status: 400 });
    }

    let coachId = data.coachId;

    if (!coachId) {
      const coaches = await prisma.user.findMany({ take: 1 });
      if (coaches.length === 0) {
        return NextResponse.json({ error: "لا يوجد مدربون في النظام" }, { status: 400 });
      }
      coachId = coaches[0].id;
    }

    const lead = await prisma.lead.create({
      data: {
        coachId,
        name: data.name,
        phone: data.phone,
        age: data.age ? parseInt(data.age) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        height: data.height ? parseFloat(data.height) : null,
        target: data.target || null,
        selectedPackageId: data.selectedPackageId ? parseInt(data.selectedPackageId) : null,
        data: data.data ? (typeof data.data === "string" ? data.data : JSON.stringify(data.data)) : "{}",
        status: "pending",
      },
    });

    await createNotification({
      coachId,
      clientName: data.name,
      type: "lead",
      title: "طلب اشتراك جديد",
      message: `هناك طلب اشتراك جديد من ${data.name}`,
      targetUrl: "/leads",
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الطلب" }, { status: 500 });
  }
}
