import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE() {
  try {
    const user = await requireAuth();
    await prisma.notification.deleteMany({ where: { coachId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
  }
}
