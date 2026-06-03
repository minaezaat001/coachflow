import { NextResponse } from "next/server";
import { utapi } from "@/lib/uploadthing";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "يجب رفع ملف PDF أو صورة (JPG, PNG, WebP) فقط" }, { status: 400 });
    }

    const maxSize = file.type === "application/pdf" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxMb = maxSize / (1024 * 1024);
      return NextResponse.json({ error: `حجم الملف يجب أن لا يتجاوز ${maxMb} ميجابايت` }, { status: 400 });
    }

    const response = await utapi.uploadFiles(file);

    if (response.error) {
      return NextResponse.json({ error: "فشل رفع الملف إلى السحابة" }, { status: 500 });
    }

    return NextResponse.json({ url: response.data.url, filename: file.name });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء رفع الملف" }, { status: 500 });
  }
}
