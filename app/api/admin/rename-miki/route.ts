import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST() {
  try {
    await requireAuth();

    const user = await prisma.user.findFirst({ where: { name: "ميكي" } });
    if (!user) {
      return NextResponse.json({ message: "لا يوجد مستخدم باسم ميكي" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { name: "المدير" },
    });

    return NextResponse.json({ message: `تم تغيير اسم ${user.email} من ميكي إلى المدير` });
  } catch (error) {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
