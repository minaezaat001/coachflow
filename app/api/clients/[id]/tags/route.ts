import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { parseTags } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const id = parseInt((await params).id);
    const data = await req.json();

    const existing = await prisma.client.findFirst({ where: { id, coachId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const client = await prisma.client.update({
      where: { id },
      data: { tags: JSON.stringify(data.tags || []) },
    });

    return NextResponse.json({ client: { ...client, tags: parseTags(client.tags) } });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث التصنيفات" }, { status: 500 });
  }
}
