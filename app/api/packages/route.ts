import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const where: any = { coachId: user.id };
    if (!all) where.isActive = true;

    const packages = await prisma.package.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الباقات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.name || !data.price || !data.durationMonths || !data.packageType) {
      return NextResponse.json({ error: "الاسم والسعر والمدة ونوع الباقة مطلوبون" }, { status: 400 });
    }

    const pkg = await prisma.package.create({
      data: {
        coachId: user.id,
        name: data.name,
        price: Math.round(parseFloat(data.price)),
        durationMonths: parseInt(data.durationMonths),
        defaultCheckInFrequency: data.defaultCheckInFrequency ? parseInt(data.defaultCheckInFrequency) : 7,
        packageType: data.packageType,
        isActive: data.isActive !== false,
        maxClients: data.maxClients ? parseInt(data.maxClients) : null,
        description: data.description || null,
      },
    });

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "فشل إنشاء الباقة" }, { status: 500 });
  }
}
