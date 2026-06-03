import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const token = (await params).token;
    const client = await prisma.client.findUnique({ where: { uniqueToken: token } });
    if (!client) {
      return NextResponse.json({ error: "الرابط غير صالح" }, { status: 404 });
    }
    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json({ error: "الرابط غير صالح" }, { status: 404 });
  }
}
