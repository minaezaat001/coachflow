import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, durationMonths: true, packageType: true, defaultCheckInFrequency: true, description: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ packages });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الباقات" }, { status: 500 });
  }
}
