import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH() {
  try {
    const user = await requireAuth();
    await prisma.notification.updateMany({
      where: { coachId: user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}
