import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";
import * as XLSX from "xlsx";

const SYSTEM_FIELDS = [
  { key: "name", label: "الاسم", required: true },
  { key: "phone", label: "رقم الهاتف", required: true },
  { key: "age", label: "السن", required: true },
  { key: "goal", label: "الهدف", required: false },
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
    name: ["name", "full name", "client name", "اسم", "الاسم", "اسم العميل", "العميل", "كامل الاسم"],
    phone: ["phone", "mobile", "telephone", "phone number", "mobile number", "تليفون", "موبايل", "رقم الهاتف", "رقم الموبايل", "هاتف", "واتساب", "whatsapp"],
    age: ["age", "ages", "العمر", "السن", "سن", "عمر"],
    goal: ["goal", "target", "objective", "aim", "الهدف", "هدف", "الغرض"],
    weight: ["weight", "وزن", "الوزن"],
    height: ["height", "length", "طول", "الطول"],
    notes: ["notes", "note", "remarks", "comments", "ملاحظات", "ملاحظة"],
    subscriptionType: ["subscription type", "plan", "package", "type", "subscription", "نوع الاشتراك", "الباقة", "الاشتراك", "النوع"],
    amountPaid: ["amount paid", "paid", "paid amount", "payment", "المدفوع", "المبلغ المدفوع", "الدفعة", "مدفوع"],
    subscriptionPrice: ["subscription price", "price", "cost", "fee", "سعر الاشتراك", "السعر", "إجمالي", "التكلفة"],
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

      // Use manual fields from enriched rows (_ prefixed fields from frontend)
      const manualStartDate = row._startDate || mapped.subscriptionStartDate || null;
      const manualAmountPaid = row._amountPaid || mapped.amountPaid || null;
      const manualPrice = row._subscriptionPrice || mapped.subscriptionPrice || null;
      const manualType = row._subscriptionType || mapped.subscriptionType || null;
      const manualDuration = row._subscriptionDuration || null;
      const manualCheckInFreq = row._defaultCheckInFrequency || null;

      // Calculate end date from start date + duration
      let manualEndDate = mapped.subscriptionEndDate || null;
      if (manualStartDate && manualDuration && !manualEndDate) {
        const start = new Date(manualStartDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + parseInt(manualDuration));
        manualEndDate = end.toISOString().split("T")[0];
      }

      // Calculate nextCheckInDate
      let nextCheckInDate = null;
      if (manualStartDate && manualCheckInFreq) {
        const start = new Date(manualStartDate);
        const next = new Date(start);
        next.setDate(next.getDate() + parseInt(manualCheckInFreq));
        nextCheckInDate = next.toISOString().split("T")[0];
      }

      // Check duplicate phone
      const existing = await prisma.client.findFirst({ where: { phone: mapped.phone, coachId: user.id } });
      if (existing) {
        results.push({ success: false, row: i + 2, name: mapped.name, error: `رقم الهاتف موجود مسبقاً للعميل ${existing.name}` });
        continue;
      }

      try {
        const uniqueToken = crypto.randomBytes(16).toString("hex");
        const now = new Date().toISOString().split("T")[0];

        const client = await prisma.client.create({
          data: {
            coachId: user.id,
            name: mapped.name,
            phone: mapped.phone,
            age: mapped.age ? parseInt(mapped.age) : null,
            goal: mapped.goal,
            weight: mapped.weight ? parseFloat(mapped.weight) : null,
            height: mapped.height ? parseFloat(mapped.height) : null,
            notes: mapped.notes || null,
            subscriptionType: manualType,
            subscriptionStartDate: manualStartDate,
            subscriptionEndDate: manualEndDate,
            subscriptionStatus: manualEndDate && manualEndDate < now ? "expired" : manualType ? "active" : "pending",
            paymentStatus: manualAmountPaid ? (parseFloat(manualAmountPaid) >= parseFloat(manualPrice || "0") ? "paid" : "partial") : "unpaid",
            packageId: row._packageId ? parseInt(row._packageId) : null,
            defaultCheckInFrequency: manualCheckInFreq ? parseInt(manualCheckInFreq) : null,
            nextCheckInDate,
            uniqueToken,
          },
        });

        // Create subscription
        if (manualPrice && manualStartDate && manualEndDate) {
          await prisma.subscription.create({
            data: {
              clientId: client.id,
              type: manualType || "monthly",
              startDate: manualStartDate,
              endDate: manualEndDate,
              price: Math.round(parseFloat(manualPrice)),
              status: manualEndDate < now ? "expired" : "active",
            },
          });
        }

        // Create payment
        if (manualAmountPaid) {
          const paidAmount = parseFloat(manualAmountPaid);
          if (!isNaN(paidAmount) && paidAmount > 0) {
            await prisma.payment.create({
              data: {
                clientId: client.id,
                amount: paidAmount,
                amountRemaining: Math.max(0, (manualPrice ? parseFloat(manualPrice) : 0) - paidAmount),
                status: paidAmount >= (manualPrice ? parseFloat(manualPrice) : 0) ? "paid" : "partial",
                method: "cash",
                paidAt: new Date().toISOString().split("T")[0],
              },
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
