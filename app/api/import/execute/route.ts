import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";
import * as XLSX from "xlsx";

const SYSTEM_FIELDS = [
  { key: "name", label: "الاسم", required: true },
  { key: "phone", label: "رقم الهاتف", required: true },
  { key: "goal", label: "الهدف", required: true },
  { key: "weight", label: "الوزن", required: false },
  { key: "height", label: "الطول", required: false },
  { key: "notes", label: "ملاحظات", required: false },
  { key: "subscriptionType", label: "نوع الاشتراك", required: false },
  { key: "subscriptionPrice", label: "سعر الاشتراك", required: false },
  { key: "amountPaid", label: "المبلغ المدفوع", required: false },
  { key: "subscriptionStartDate", label: "تاريخ البداية", required: false },
  { key: "subscriptionEndDate", label: "تاريخ النهاية", required: false },
] as const;

function detectField(column: string): string | null {
  const c = column.trim().toLowerCase();
  const map: Record<string, string[]> = {
    name: ["name", "full name", "client name", "اسم", "الاسم", "اسم العميل", "العميل"],
    phone: ["phone", "mobile", "telephone", "phone number", "mobile number", "تليفون", "موبايل", "رقم الهاتف", "رقم الموبايل", "هاتف"],
    goal: ["goal", "target", "objective", "aim", "الهدف", "هدف", "الغرض"],
    weight: ["weight", "وزن", "الوزن"],
    height: ["height", "length", "طول", "الطول"],
    notes: ["notes", "note", "remarks", "comments", "ملاحظات", "ملاحظة"],
    subscriptionType: ["subscription type", "plan", "package", "type", "subscription", "نوع الاشتراك", "الباقة", "الاشتراك", "النوع"],
    subscriptionPrice: ["subscription price", "price", "amount", "cost", "fee", "سعر الاشتراك", "السعر", "المبلغ", "التكلفة"],
    amountPaid: ["amount paid", "paid", "paid amount", "payment", "المدفوع", "المبلغ المدفوع", "الدفعة", "مدفوع"],
    subscriptionStartDate: ["start date", "start", "begin date", "تاريخ البداية", "بداية", "من"],
    subscriptionEndDate: ["end date", "end", "expiry", "تاريخ النهاية", "نهاية", "إلى"],
  };
  for (const [key, aliases] of Object.entries(map)) {
    if (aliases.some((a) => c === a || c.includes(a))) return key;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { mapping, rows } = body as { mapping: Record<string, string>; rows: Record<string, string>[] };

    if (!mapping || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const results: { success: boolean; row: number; name?: string; error?: string }[] = [];
    const createdClients: number[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const mapped: Record<string, string> = {};
      const mapEntries = Object.entries(mapping) as [string, string][];
      for (const [col, sysField] of mapEntries) {
        if (sysField) mapped[sysField] = (row[col] || "").toString().trim();
      }

      if (!mapped.name) {
        results.push({ success: false, row: i + 2, error: "الاسم مطلوب" });
        continue;
      }
      if (!mapped.phone) {
        results.push({ success: false, row: i + 2, name: mapped.name, error: "رقم الهاتف مطلوب" });
        continue;
      }
      if (!mapped.goal) mapped.goal = "عام";

      // Check duplicate phone
      const existing = await prisma.client.findFirst({ where: { phone: mapped.phone, coachId: user.id } });
      if (existing) {
        results.push({ success: false, row: i + 2, name: mapped.name, error: `رقم الهاتف موجود مسبقاً للعميل ${existing.name}` });
        continue;
      }

      try {
        const uniqueToken = crypto.randomBytes(16).toString("hex");
        const client = await prisma.client.create({
          data: {
            coachId: user.id,
            name: mapped.name,
            phone: mapped.phone,
            goal: mapped.goal,
            weight: mapped.weight ? parseFloat(mapped.weight) : null,
            height: mapped.height ? parseFloat(mapped.height) : null,
            notes: mapped.notes || null,
            subscriptionType: mapped.subscriptionType || null,
            subscriptionStartDate: mapped.subscriptionStartDate || null,
            subscriptionEndDate: mapped.subscriptionEndDate || null,
            subscriptionStatus: mapped.subscriptionType ? "active" : "pending",
            paymentStatus: "unpaid",
            uniqueToken,
          },
        });

        // Create subscription if price provided
        if (mapped.subscriptionPrice && mapped.subscriptionStartDate && mapped.subscriptionEndDate) {
          await prisma.subscription.create({
            data: {
              clientId: client.id,
              type: mapped.subscriptionType || "monthly",
              startDate: mapped.subscriptionStartDate,
              endDate: mapped.subscriptionEndDate,
              price: Math.round(parseFloat(mapped.subscriptionPrice)),
              status: "active",
            },
          });
        }

        // Create payment if amountPaid provided
        if (mapped.amountPaid) {
          const paidAmount = parseFloat(mapped.amountPaid);
          if (!isNaN(paidAmount) && paidAmount > 0) {
            await prisma.payment.create({
              data: {
                clientId: client.id,
                amount: paidAmount,
                status: "paid",
                method: "cash",
                paidAt: new Date().toISOString(),
              },
            });
            await prisma.client.update({
              where: { id: client.id },
              data: { paymentStatus: "paid" },
            });
          }
        }

        createdClients.push(client.id);
        results.push({ success: true, row: i + 2, name: mapped.name });
      } catch (err: any) {
        results.push({ success: false, row: i + 2, name: mapped.name, error: err.message || "خطأ في إنشاء العميل" });
      }
    }

    return NextResponse.json({
      total: rows.length,
      created: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Import execute error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تنفيذ الاستيراد" }, { status: 500 });
  }
}
