import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireAdmin();

    const coaches = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { clients: true } },
      },
    });

    const data = coaches.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      role: c.role,
      suspended: c.suspended,
      clientCount: c._count.clients,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ coaches: data });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبون" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const coach = await prisma.user.create({
      data: { email, passwordHash, name, role: role || "coach" },
    });

    return NextResponse.json({ coach: { id: coach.id, email: coach.email, name: coach.name, role: coach.role } });
  } catch (error) {
    return NextResponse.json({ error: "فشل إنشاء المدرب" }, { status: 500 });
  }
}
