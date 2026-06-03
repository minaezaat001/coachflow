import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const notification = await prisma.notification.findFirst({ where: { id, coachId: user.id } });
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ notification: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
