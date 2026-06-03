import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await prisma.notification.findMany({
      where: { coachId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
