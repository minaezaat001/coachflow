import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth";

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الخروج" }, { status: 500 });
  }
}
