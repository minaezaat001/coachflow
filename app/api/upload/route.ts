import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;
    const field = formData.get("field") as string | null;

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || ".bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s.-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url, filename: safeName });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء رفع الملف" }, { status: 500 });
  }
}
