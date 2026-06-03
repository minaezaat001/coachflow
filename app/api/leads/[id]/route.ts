import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const lead = await prisma.lead.findFirst({
      where: { id, coachId: user.id },
      include: { package: { select: { id: true, name: true, price: true } } },
    });
    if (!lead) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الطلب" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const lead = await prisma.lead.findFirst({ where: { id, coachId: user.id } });
    if (!lead) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { status: data.status || lead.status },
    });

    return NextResponse.json({ lead: updated });
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الطلب" }, { status: 500 });
  }
}
