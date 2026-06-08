"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, ChevronRight, ChevronLeft, Download, X, Loader2, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SYSTEM_FIELDS = [
  { key: "", label: "-- لا تقم بالاستيراد --" },
  { key: "name", label: "الاسم", required: true },
  { key: "phone", label: "رقم الهاتف", required: true },
  { key: "goal", label: "الهدف", required: true },
  { key: "weight", label: "الوزن" },
  { key: "height", label: "الطول" },
  { key: "notes", label: "ملاحظات" },
  { key: "subscriptionType", label: "نوع الاشتراك" },
  { key: "subscriptionPrice", label: "سعر الاشتراك" },
  { key: "amountPaid", label: "المبلغ المدفوع" },
  { key: "subscriptionStartDate", label: "تاريخ البداية" },
  { key: "subscriptionEndDate", label: "تاريخ النهاية" },
];

const FIELD_ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "client name", "اسم", "الاسم", "اسم العميل", "العميل"],
  phone: ["phone", "mobile", "telephone", "phone number", "mobile number", "تليفون", "موبايل", "رقم الهاتف", "رقم الموبايل", "هاتف"],
  goal: ["goal", "target", "objective", "aim", "الهدف", "هدف", "الغرض"],
  weight: ["weight", "وزن", "الوزن"],
  height: ["height", "length", "طول", "الطول"],
  notes: ["notes", "note", "remarks", "comments", "ملاحظات", "ملاحظة", "age", "العمر", "سن"],
  subscriptionType: ["subscription type", "plan", "package", "type", "subscription", "نوع الاشتراك", "الباقة", "الاشتراك", "النوع"],
  subscriptionPrice: ["subscription price", "price", "amount", "cost", "fee", "سعر الاشتراك", "السعر", "المبلغ", "التكلفة"],
  amountPaid: ["amount paid", "paid", "paid amount", "payment", "المدفوع", "المبلغ المدفوع", "الدفعة", "مدفوع"],
  subscriptionStartDate: ["start date", "start", "begin date", "تاريخ البداية", "بداية", "من"],
  subscriptionEndDate: ["end date", "end", "expiry", "تاريخ النهاية", "نهاية", "إلى"],
};

function detectField(column: string): string {
  const c = column.trim().toLowerCase();
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => c === a || c.startsWith(a) || a.startsWith(c))) return key;
  }
  return "";
}

export default function ImportWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls") && !ext.endsWith(".csv")) {
      toast({ title: "صيغة غير مدعومة. يرجى رفع ملف Excel أو CSV.", variant: "destructive" });
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast({ title: "حجم الملف يجب أن لا يتجاوز 25 ميجابايت", variant: "destructive" });
      return;
    }
    setFile(f);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/import/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "فشل قراءة الملف", variant: "destructive" }); setLoading(false); return; }
      setHeaders(data.headers);
      setPreview(data.preview);
      setAllRows(data.allRows || []);
      setTotalRows(data.totalRows);
      // Auto-detect mapping
      const auto: Record<string, string> = {};
      data.headers.forEach((h: string) => { auto[h] = detectField(h); });
      setMapping(auto);
      setStep(1);
    } catch { toast({ title: "حدث خطأ أثناء قراءة الملف", variant: "destructive" }); }
    setLoading(false);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, [handleFile]);

  const validateRows = useCallback(() => {
    const errors: { row: number; field: string; msg: string }[] = [];
    allRows.forEach((row, i) => {
      const name = row[mapping.name ? Object.keys(mapping).find(k => mapping[k] === "name") || "" : ""]?.trim();
      const phone = row[mapping.phone ? Object.keys(mapping).find(k => mapping[k] === "phone") || "" : ""]?.trim();
      if (!name) errors.push({ row: i + 2, field: "الاسم", msg: "الاسم مطلوب" });
      if (!phone) errors.push({ row: i + 2, field: "رقم الهاتف", msg: "رقم الهاتف مطلوب" });
    });
    return errors;
  }, [allRows, mapping]);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapping, rows: allRows }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "فشل الاستيراد", variant: "destructive" }); setLoading(false); return; }
      setResults(data.results);
      setStep(4);
    } catch { toast({ title: "حدث خطأ أثناء الاستيراد", variant: "destructive" }); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Steps indicator */}
      {results === null && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {["رفع الملف", "تطابق الأعمدة", "مراجعة البيانات", "تأكيد"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all", step === i ? "bg-primary text-white" : step > i ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/20 text-muted-foreground")}>
                {step > i ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <ChevronLeft className="w-4 h-4 text-muted-foreground/30" />}
            </div>
          ))}
        </div>
      )}

      {results === null && step === 0 && (
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/40 backdrop-blur-md p-8">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black text-center">استيراد العملاء من ملف Excel</h2>
            <p className="text-sm text-muted-foreground font-medium text-center max-w-md">قم برفع ملف Excel أو CSV لاستيراد العملاء بشكل مجمّع. يمكنك تنزيل القالب أولاً للتأكد من التنسيق الصحيح.</p>
            <div
              className={cn("w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer", dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 hover:bg-muted/10")}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <Upload className={cn("w-10 h-10 mx-auto mb-4", dragOver ? "text-primary" : "text-muted-foreground/30")} />
              <p className={cn("text-sm font-black mb-1", dragOver ? "text-primary" : "text-muted-foreground")}>
                {dragOver ? "أفلت الملف هنا" : "اسحب وأفلت الملف هنا"}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground/50">أو اضغط لاختيار ملف · Excel أو CSV</p>
            </div>
            <div className="flex items-center gap-4">
              {loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              <a href="/api/import/template" className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 transition-colors">
                <Download className="w-4 h-4" />
                تنزيل قالب Excel
              </a>
            </div>
          </div>
        </Card>
      )}

      {results === null && step === 1 && (
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/40 backdrop-blur-md p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black">تطابق الأعمدة</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">اختر حقل النظام المقابل لكل عمود من ملفك</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-black gap-1.5" onClick={() => {
              const auto: Record<string, string> = {};
              headers.forEach((h) => { auto[h] = detectField(h); });
              setMapping(auto);
            }}>
              <HelpCircle className="w-3.5 h-3.5" />
              كشف تلقائي
            </Button>
          </div>
          <div className="space-y-3">
            {headers.map((h) => (
              <div key={h} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{h}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                <div className="w-64">
                  <Select value={mapping[h] || ""} onValueChange={(v) => setMapping((prev) => ({ ...prev, [h]: v }))}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/20 border-border/40 text-xs font-bold">
                      <SelectValue placeholder="اختر الحقل" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key} className="text-xs font-bold">{f.label} {f.required ? "•" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4 border-t border-border/20">
            <Button variant="ghost" className="text-xs font-black gap-1.5" onClick={() => setStep(0)}>
              <ChevronRight className="w-4 h-4" /> رجوع
            </Button>
            <Button className="text-xs font-black gap-1.5" onClick={() => setStep(2)}>
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {results === null && step === 2 && (
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/40 backdrop-blur-md p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black">مراجعة البيانات</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">إجمالي {totalRows} صف · عرض أول {Math.min(10, allRows.length)} صف</p>
            </div>
            {validateRows().length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-black">
                <AlertCircle className="w-3.5 h-3.5" />
                {validateRows().length} خطأ
              </div>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/10 border-b border-border/30">
                  <th className="px-4 py-3 text-start font-black text-muted-foreground">#</th>
                  {headers.filter((h) => mapping[h]).map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-black text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-border/10 hover:bg-muted/5">
                    <td className="px-4 py-3 font-black text-muted-foreground/50">{i + 2}</td>
                    {headers.filter((h) => mapping[h]).map((h) => (
                      <td key={h} className="px-4 py-3 font-medium max-w-[200px] truncate">{row[h] || <span className="text-muted-foreground/30">--</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {validateRows().length > 0 && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-black text-amber-500">الأخطاء المكتشفة</p>
              </div>
              <div className="space-y-1.5">
                {validateRows().slice(0, 5).map((err, i) => (
                  <p key={i} className="text-[11px] font-medium text-muted-foreground">الصف {err.row}: {err.msg}</p>
                ))}
                {validateRows().length > 5 && <p className="text-[11px] font-medium text-muted-foreground">و {validateRows().length - 5} خطأ آخر...</p>}
              </div>
            </div>
          )}
          <div className="flex justify-between pt-4 border-t border-border/20">
            <Button variant="ghost" className="text-xs font-black gap-1.5" onClick={() => setStep(1)}>
              <ChevronRight className="w-4 h-4" /> رجوع
            </Button>
            <Button className="text-xs font-black gap-1.5" onClick={() => setStep(3)}>
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {results === null && step === 3 && (
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/40 backdrop-blur-md p-6 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-lg font-black mb-2">تأكيد الاستيراد</h3>
            <p className="text-sm text-muted-foreground font-medium">سيتم استيراد {allRows.filter((row) => { const nk = Object.keys(mapping).find(k => mapping[k] === "name"); const pk = Object.keys(mapping).find(k => mapping[k] === "phone"); return row[nk || ""]?.trim() && row[pk || ""]?.trim(); }).length} عميل بنجاح</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/10 border border-border/30 text-center">
              <p className="text-2xl font-black text-foreground">{allRows.length}</p>
              <p className="text-[10px] font-black text-muted-foreground mt-1">إجمالي الصفوف</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <p className="text-2xl font-black text-emerald-500">{allRows.filter((row) => { const nk = Object.keys(mapping).find(k => mapping[k] === "name"); const pk = Object.keys(mapping).find(k => mapping[k] === "phone"); return row[nk || ""]?.trim() && row[pk || ""]?.trim(); }).length}</p>
              <p className="text-[10px] font-black text-emerald-500 mt-1">العميل صالحة</p>
            </div>
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
              <p className="text-2xl font-black text-destructive">{validateRows().length}</p>
              <p className="text-[10px] font-black text-destructive mt-1">صفوف بها أخطاء</p>
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t border-border/20">
            <Button variant="ghost" className="text-xs font-black gap-1.5" onClick={() => setStep(2)}>
              <ChevronRight className="w-4 h-4" /> رجوع
            </Button>
            <Button disabled={loading} className="text-xs font-black gap-2 bg-primary hover:bg-primary/90" onClick={handleExecute}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? "جاري الاستيراد..." : "تأكيد واستيراد"}
            </Button>
          </div>
        </Card>
      )}

      {results !== null && (
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/40 backdrop-blur-md p-6 space-y-6">
          <div className="text-center">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4", results.filter(r => r.success).length === results.length ? "bg-emerald-500/10" : "bg-amber-500/10")}>
              {results.filter(r => r.success).length === results.length ? <Check className="w-7 h-7 text-emerald-500" /> : <AlertCircle className="w-7 h-7 text-amber-500" />}
            </div>
            <h3 className="text-lg font-black mb-2">نتيجة الاستيراد</h3>
            <p className="text-sm text-muted-foreground font-medium">تم استيراد {results.filter(r => r.success).length} من أصل {results.length} عميل بنجاح</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <p className="text-2xl font-black text-emerald-500">{results.filter(r => r.success).length}</p>
              <p className="text-[10px] font-black text-emerald-500 mt-1">تم الاستيراد بنجاح</p>
            </div>
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
              <p className="text-2xl font-black text-destructive">{results.filter(r => !r.success).length}</p>
              <p className="text-[10px] font-black text-destructive mt-1">فشل الاستيراد</p>
            </div>
          </div>
          {results.filter(r => !r.success).length > 0 && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-destructive/10 flex items-center gap-2">
                <X className="w-4 h-4 text-destructive" />
                <p className="text-xs font-black text-destructive">الصفوف التي فشلت</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {results.filter(r => !r.success).map((r, i) => (
                  <div key={i} className="px-4 py-2.5 border-b border-destructive/5 text-xs">
                    <span className="font-black">الصف {r.row}:</span> {r.name && <span className="font-bold mx-1">{r.name} -</span>} <span className="text-destructive font-medium">{r.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-center pt-4">
            <Button className="text-xs font-black gap-1.5" onClick={() => { setStep(0); setFile(null); setHeaders([]); setPreview([]); setAllRows([]); setMapping({}); setResults(null); setTotalRows(0); }}>
              <Upload className="w-4 h-4" />
              استيراد ملف جديد
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
