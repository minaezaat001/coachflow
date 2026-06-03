import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const wb = XLSX.utils.book_new();
    const data = [
      {
        "Full Name": "أحمد محمد",
        "Phone Number": "01001234567",
        Goal: "خسارة وزن",
        Weight: "85",
        Height: "175",
        "Subscription Type": "monthly",
        "Subscription Price": "1500",
        "Amount Paid": "1500",
        "Start Date": "2026-01-01",
        "End Date": "2026-02-01",
        Notes: "مبتدئ",
      },
      {
        "Full Name": "example_name",
        "Phone Number": "01007654321",
        Goal: "تضخيم عضلات",
        Weight: "70",
        Height: "170",
        "Subscription Type": "quarterly",
        "Subscription Price": "4000",
        "Amount Paid": "2000",
        "Start Date": "2026-02-01",
        "End Date": "2026-05-01",
        Notes: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="coachflow-import-template.xlsx"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء القالب" }, { status: 500 });
  }
}
