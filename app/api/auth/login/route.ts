import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "البريد الإلكتروني وكلمة السر مطلوبان" }, { status: 400 });
    }
    const user = await loginUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "البريد الإلكتروني أو كلمة السر غير صحيحة" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Login error:", error?.message || error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
