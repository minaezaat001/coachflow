import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const existing = await prisma.package.findFirst({ where: { id, coachId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "الباقة غير موجودة" }, { status: 404 });
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.price !== undefined && { price: Math.round(parseFloat(data.price)) }),
        ...(data.durationMonths !== undefined && { durationMonths: parseInt(data.durationMonths) }),
        ...(data.defaultCheckInFrequency !== undefined && { defaultCheckInFrequency: parseInt(data.defaultCheckInFrequency) }),
        ...(data.packageType !== undefined && { packageType: data.packageType }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.maxClients !== undefined && { maxClients: data.maxClients ? parseInt(data.maxClients) : null }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return NextResponse.json({ package: pkg });
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الباقة" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);

    const existing = await prisma.package.findFirst({ where: { id, coachId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "الباقة غير موجودة" }, { status: 404 });
    }

    const clientCount = await prisma.client.count({ where: { packageId: id } });
    if (clientCount > 0) {
      return NextResponse.json({
        error: `لا يمكن حذف الباقة، مرتبطة بـ ${clientCount} عميل`
      }, { status: 400 });
    }

    await prisma.package.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "فشل حذف الباقة" }, { status: 500 });
  }
}
