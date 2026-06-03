import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = file.name.toLowerCase();

    let headers: string[] = [];
    let rows: Record<string, string>[] = [];

    if (name.endsWith(".csv")) {
      const Papa = await import("papaparse");
      const csvStr = buffer.toString("utf-8");
      const parsed = Papa.parse(csvStr, { header: true, skipEmptyLines: true, dynamicTyping: false });
      headers = parsed.meta.fields || [];
      rows = parsed.data as Record<string, string>[];
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
      if (json.length > 0) headers = Object.keys(json[0]);
      rows = json;
    } else {
      return NextResponse.json({ error: "يجب رفع ملف Excel أو CSV فقط" }, { status: 400 });
    }

    if (headers.length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على أعمدة في الملف. تأكد من أن الملف يحتوي على صف رأس." }, { status: 400 });
    }

    const preview = rows.slice(0, 5);
    const totalRows = rows.length;

    return NextResponse.json({ headers, preview, totalRows, allRows: rows.slice(0, 200) });
  } catch (error) {
    console.error("Import parse error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء قراءة الملف. تأكد من أن الملف بصيغة صحيحة." }, { status: 500 });
  }
}
