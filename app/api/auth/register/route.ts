import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "البريد الإلكتروني وكلمة السر والاسم مطلوبون" }, { status: 400 });
    }
    const user = await registerUser(email, password, name);
    if (!user) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 409 });
    }
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 500 });
  }
}
