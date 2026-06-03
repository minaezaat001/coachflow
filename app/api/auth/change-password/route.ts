import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "كلمة المرور الحالية والجديدة مطلوبتان" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تغيير كلمة المرور" }, { status: 500 });
  }
}
