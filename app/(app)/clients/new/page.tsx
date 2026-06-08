"use client"
import React, { Suspense, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Loader2, User, Wallet, FileText, Package } from "lucide-react"
import Link from "next/link"
import { PdfUpload } from "@/components/PdfUpload"

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(10, "رقم الهاتف غير صحيح"),
  goal: z.string().min(1, "الهدف مطلوب"),
  weight: z.string().optional(),
  height: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  packageId: z.string().min(1, "الباقة مطلوبة — اختر باقة للاشتراك"),
  subscriptionType: z.string().min(1, "نوع الاشتراك مطلوب"),
  subscriptionDuration: z.string().min(1, "مدة الاشتراك مطلوبة"),
  subscriptionStartDate: z.string().min(1, "تاريخ البداية مطلوب"),
  subscriptionEndDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  subscriptionPrice: z.string().min(1, "قيمة الاشتراك مطلوبة"),
  paidAmount: z.string().min(1, "المبلغ المدفوع مطلوب"),
})

type FormValues = z.infer<typeof schema>

interface PackageOption {
  id: number
  name: string
  price: number
  durationMonths: number
  defaultCheckInFrequency: number
  packageType: string
}

function ClientNewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [dietPlanUrl, setDietPlanUrl] = React.useState<string | null>(null)
  const [workoutPlanUrl, setWorkoutPlanUrl] = React.useState<string | null>(null)

  const leadId = searchParams.get("leadId")

  const { data: packagesData } = useQuery({
    queryKey: ["packages-active"],
    queryFn: async () => {
      const res = await fetch("/api/packages")
      const data = await res.json()
      return (data.packages || []) as PackageOption[]
    },
  })

  const activePackages = packagesData || []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: searchParams.get("name") || "",
      phone: searchParams.get("phone") || "",
      goal: searchParams.get("goal") || "لياقة",
      weight: searchParams.get("weight") || "",
      height: searchParams.get("height") || "",
      packageId: searchParams.get("packageId") || "",
      subscriptionType: "أونلاين كامل",
      subscriptionDuration: "1",
      subscriptionStartDate: new Date().toISOString().split("T")[0],
    },
  })

  const goal = watch("goal")
  const subType = watch("subscriptionType")
  const subDuration = watch("subscriptionDuration")
  const subStartDate = watch("subscriptionStartDate")
  const packageId = watch("packageId")

  useEffect(() => {
    if (subStartDate && subDuration) {
      const startDate = new Date(subStartDate)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + parseInt(subDuration))
      setValue("subscriptionEndDate", endDate.toISOString().split("T")[0])
    }
  }, [subStartDate, subDuration, setValue])

  useEffect(() => {
    if (packageId) {
      const pkg = activePackages.find((p) => p.id === parseInt(packageId))
      if (pkg) {
        setValue("subscriptionPrice", String(Math.round(pkg.price)))
        setValue("subscriptionDuration", String(pkg.durationMonths))
        const typeMap: Record<string, string> = {
          training: "نظام تدريبي فقط",
          nutrition: "نظام غذائي فقط",
          both: "أونلاين كامل",
        }
        setValue("subscriptionType", typeMap[pkg.packageType] || "أونلاين كامل")
        const end = new Date()
        end.setMonth(end.getMonth() + pkg.durationMonths)
        setValue("subscriptionEndDate", end.toISOString().split("T")[0])
      }
    }
  }, [packageId, activePackages, setValue])

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const tags = values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : []

      const payload: any = {
        name: values.name,
        phone: values.phone,
        goal: values.goal,
        weight: values.weight || null,
        height: values.height || null,
        notes: values.notes || null,
        tags,
        packageId: values.packageId ? parseInt(values.packageId) : null,
        subscriptionType: values.subscriptionType,
        subscriptionStartDate: values.subscriptionStartDate,
        subscriptionEndDate: values.subscriptionEndDate,
        subscriptionPrice: values.subscriptionPrice,
        paymentAmount: values.paidAmount,
        dietPlanUrl: dietPlanUrl,
        workoutPlanUrl: workoutPlanUrl,
        paymentStatus: parseFloat(values.paidAmount) >= parseFloat(values.subscriptionPrice) ? "paid" : "partial",
        paymentMethod: "cash",
        paidAt: new Date().toISOString().split("T")[0],
        onboarded: true,
      }

      const pkg = activePackages.find((p) => p.id === parseInt(values.packageId || "0"))
      if (pkg) {
        payload.defaultCheckInFrequency = pkg.defaultCheckInFrequency
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "فشل إضافة العميل" }))
        throw new Error(err.error || "فشل إضافة العميل")
      }

      return res.json()
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const data = await createMutation.mutateAsync(values)

      if (leadId) {
        const leadRes = await fetch(`/api/leads/${leadId}`)
        if (leadRes.ok) {
          const leadData = await leadRes.json()
          const lead = leadData.lead
          let parsedData: any = {}
          if (lead.data) {
            try { parsedData = typeof lead.data === "string" ? JSON.parse(lead.data) : lead.data } catch {}
          }
          if (lead.age) parsedData.age = String(lead.age)
          if (lead.weight) parsedData.weight = String(lead.weight)
          if (lead.height) parsedData.height = String(lead.height)
          if (Object.keys(parsedData).length > 0) {
            await fetch("/api/onboarding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientId: data.client.id, data: parsedData }),
            }).catch(() => {})
          }
        }
        await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "converted" }),
        }).catch(() => {})
      }

      qc.invalidateQueries({ queryKey: ["clients"] })
      toast({ title: "تم إضافة العميل بنجاح" })
      router.push(`/clients/${data.client.id}`)
    } catch (err: any) {
      toast({ title: "حدث خطأ أثناء الإضافة", description: err?.message || "حاول مرة أخرى", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-8 max-w-3xl animate-fade-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/clients">
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-muted-foreground hover:text-primary gap-1 font-bold">
                <ArrowRight className="w-4 h-4" />
                العملاء
              </Button>
            </Link>
            {leadId && (
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-muted-foreground hover:text-primary gap-1 font-bold">
                  <ArrowRight className="w-4 h-4" />
                  طلبات الاشتراك
                </Button>
              </Link>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight">إضافة عميل جديد</h1>
          <p className="text-muted-foreground font-medium mt-1">{leadId ? "تم تعبئة البيانات تلقائياً من طلب الاشتراك" : "قم بتسجيل بيانات المتدرب الجديد وإعداد برنامجه الأول"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card className="premium-shadow border-border rounded-[2rem] bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 p-6">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              البيانات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">الاسم بالكامل *</Label>
                <Input {...register("name")} placeholder="محمد أحمد" className="rounded-xl h-11 border-border/50 bg-background/50 focus:bg-background transition-all" />
                {errors.name && <p className="text-xs text-destructive font-bold">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">رقم الهاتف (واتساب) *</Label>
                <Input {...register("phone")} placeholder="01012345678" dir="ltr" className="rounded-xl h-11 border-border/50 bg-background/50 focus:bg-background transition-all" />
                {errors.phone && <p className="text-xs text-destructive font-bold">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-black text-foreground">الهدف الرئيسي *</Label>
              <Select value={goal} onValueChange={(v) => setValue("goal", v)}>
                <SelectTrigger className="rounded-xl h-11 border-border/50 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="تخسيس" className="rounded-lg">تخسيس</SelectItem>
                  <SelectItem value="تضخيم" className="rounded-lg">تضخيم</SelectItem>
                  <SelectItem value="لياقة" className="rounded-lg">لياقة</SelectItem>
                  <SelectItem value="تحسين صحي" className="rounded-lg">تحسين صحي</SelectItem>
                  <SelectItem value="أخرى" className="rounded-lg">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">الوزن الحالي (كجم)</Label>
                <Input {...register("weight")} type="number" placeholder="80" className="rounded-xl h-11 border-border/50 bg-background/50 focus:bg-background transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">الطول (سم)</Label>
                <Input {...register("height")} type="number" placeholder="175" className="rounded-xl h-11 border-border/50 bg-background/50 focus:bg-background transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-black text-foreground">التاجات (مفصولة بفاصلة)</Label>
              <Input {...register("tags")} placeholder="VIP, جديد, محتاج متابعة" className="rounded-xl h-11 border-border/50 bg-background/50 focus:bg-background transition-all" />
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border rounded-[2rem] bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 p-6">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              بيانات الاشتراك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <Label className="text-sm font-black text-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                اختر باقة *
              </Label>
              <Select value={packageId || ""} onValueChange={(v) => setValue("packageId", v || "")}>
                <SelectTrigger className="rounded-xl h-11 border-border/50 bg-background/50">
                  <SelectValue placeholder="اختر باقة" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border max-h-60">
                  {activePackages.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground font-medium">
                      لا توجد باقات متاحة
                    </div>
                  ) : activePackages.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="rounded-lg">
                      {p.name} — {p.price.toLocaleString()} ج.م
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.packageId && <p className="text-xs text-destructive font-bold">{errors.packageId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-black text-foreground">نوع البرنامج *</Label>
              <Select value={subType} onValueChange={(v) => setValue("subscriptionType", v)}>
                <SelectTrigger className="rounded-xl h-11 border-border/50 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="أونلاين كامل" className="rounded-lg">أونلاين كامل</SelectItem>
                  <SelectItem value="نظام غذائي فقط" className="rounded-lg">نظام غذائي فقط</SelectItem>
                  <SelectItem value="نظام تدريبي فقط" className="rounded-lg">نظام تدريبي فقط</SelectItem>
                  <SelectItem value="متابعة VIP" className="rounded-lg">متابعة VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">المدة (بالشهر) *</Label>
                <Select value={subDuration} onValueChange={(v) => setValue("subscriptionDuration", v)}>
                  <SelectTrigger className="rounded-xl h-11 border-border/50 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="1" className="rounded-lg">شهر</SelectItem>
                    <SelectItem value="3" className="rounded-lg">3 أشهر</SelectItem>
                    <SelectItem value="6" className="rounded-lg">6 أشهر</SelectItem>
                    <SelectItem value="12" className="rounded-lg">سنة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">تاريخ البداية *</Label>
                <Input {...register("subscriptionStartDate")} type="date" className="rounded-xl h-11 border-border/50 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">تاريخ النهاية *</Label>
                <Input {...register("subscriptionEndDate")} type="date" readOnly className="rounded-xl h-11 bg-muted/30 text-muted-foreground border-border/50 cursor-not-allowed font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">قيمة الاشتراك (ج.م) *</Label>
                <Input {...register("subscriptionPrice")} type="number" placeholder="500" className="rounded-xl h-11 border-border/50 bg-background/50 font-bold text-primary" />
                {errors.subscriptionPrice && <p className="text-xs text-destructive font-bold">{errors.subscriptionPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black text-foreground">المبلغ المدفوع (ج.م) *</Label>
                <Input {...register("paidAmount")} type="number" placeholder="250" className="rounded-xl h-11 border-border/50 bg-background/50 font-bold text-emerald-500" />
                {errors.paidAmount && <p className="text-xs text-destructive font-bold">{errors.paidAmount.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border rounded-[2rem] bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 p-6">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              الخطط والملفات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PdfUpload label="نظام التغذية (PDF)" value={dietPlanUrl} onChange={setDietPlanUrl} />
              <PdfUpload label="نظام التمرين (PDF)" value={workoutPlanUrl} onChange={setWorkoutPlanUrl} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-black text-foreground">ملاحظات خاصة</Label>
              <Textarea {...register("notes")} placeholder="أي ملاحظات فنية أو طبية للعميل..." rows={4} className="rounded-2xl border-border/50 bg-background/50 focus:bg-background transition-all p-4" />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12 px-4 sm:px-0">
          <Button type="submit" disabled={createMutation.isPending} className="h-14 px-10 rounded-[1.25rem] bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:flex-1">
            {createMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin ml-3" /> جاري الحفظ...</>
            ) : "حفظ بيانات العميل"}
          </Button>
          <Link href={leadId ? "/leads" : "/clients"} className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="h-14 px-10 rounded-[1.25rem] font-bold border-border bg-card/50 backdrop-blur-sm hover:bg-muted/50 w-full sm:w-auto">إلغاء</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function ClientNew() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
      </div>
    }>
      <ClientNewForm />
    </Suspense>
  )
}
