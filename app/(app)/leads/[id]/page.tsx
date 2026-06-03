"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Phone, Calendar, Weight, Ruler, User, Star, UserPlus, Loader2, Camera, Apple, Heart, Dumbbell, Target, Hash, ChevronLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const goalLabels: Record<string, string> = {
  loss: "خسارة وزن", gain: "زيادة كتلة عضلية", fit: "لياقة عامة", health: "تحسين صحي", other: "أخرى",
  تخسيس: "تخسيس", تضخيم: "تضخيم", لياقة: "لياقة", "تحسين صحي": "تحسين صحي", أخرى: "أخرى",
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/leads/${id}`)
        if (res.ok) {
          const d = await res.json()
          setLead(d.lead)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const goToConvert = () => {
    const params = new URLSearchParams({
      leadId: String(lead.id),
      name: lead.name || "",
      phone: lead.phone || "",
    })
    if (lead.age) params.set("age", String(lead.age))
    if (lead.weight) params.set("weight", String(lead.weight))
    if (lead.height) params.set("height", String(lead.height))
    if (lead.selectedPackageId) params.set("packageId", String(lead.selectedPackageId))
    router.push(`/clients/new?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="h-8 w-40 rounded-xl bg-muted/10 animate-pulse" />
        <div className="h-48 rounded-[2rem] bg-muted/10 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 rounded-2xl bg-muted/10 animate-pulse" />
          <div className="h-40 rounded-2xl bg-muted/10 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-12 text-center">
        <p className="font-bold text-muted-foreground">الطلب غير موجود</p>
        <Link href="/leads"><Button variant="outline" className="mt-4 rounded-xl">العودة لطلبات الاشتراك</Button></Link>
      </div>
    )
  }

  const data = (() => {
    if (!lead.data) return null
    try { return typeof lead.data === "string" ? JSON.parse(lead.data) : lead.data } catch { return null }
  })()

  const measurements = data?.bodyMeasurements
  const photos = data?.photos
  const proteinSources = data?.proteinSources
  const carbSources = data?.carbSources
  const fatSources = data?.fatSources

  const BlockTitle = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border/20">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h2 className="text-base font-black">{text}</h2>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 font-bold text-muted-foreground hover:text-primary text-xs rounded-xl">
              <ChevronLeft className="w-4 h-4" />
              طلبات الاشتراك
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-black text-[10px] px-3 py-1.5 rounded-lg ${lead.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}>
            {lead.status === "pending" ? "بانتظار المراجعة" : "تم التحويل"}
          </Badge>
          {lead.status === "pending" && (
            <Button size="sm" className="h-9 px-4 rounded-xl font-black text-[10px] gap-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all" onClick={goToConvert}>
              <UserPlus className="w-4 h-4" />
              تحويل كعميل
            </Button>
          )}
        </div>
      </div>

      {/* Hero block */}
      <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/15 via-primary/5 to-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="px-8 pb-8 -mt-10 relative">
          <div className="flex items-end gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 border-4 border-card flex items-center justify-center font-black text-white text-3xl shadow-xl">
              {lead.name?.charAt(0)}
            </div>
            <div className="flex-1 pt-4">
              <h1 className="text-2xl font-black">{lead.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" />{lead.phone}</span>
                {lead.age && <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-primary" />{lead.age} سنة</span>}
                {lead.weight && <span className="flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-primary" />{lead.weight} كجم</span>}
                {lead.height && <span className="flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5 text-primary" />{lead.height} سم</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-muted-foreground/50">
                <Calendar className="w-3 h-3" />
                تاريخ الطلب: {new Date(lead.createdAt).toLocaleDateString("ar-EG")}
              </div>
            </div>
          </div>
          {lead.package && (
            <div className="mt-5 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60">الباقة المفضلة</p>
                <p className="font-black">{lead.package.name} — {lead.package.price} ج.م</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Body Measurements Block */}
      {measurements && (
        <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm p-8">
          <BlockTitle icon={<Ruler className="w-4 h-4" />} text="المقاسات (سم)" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "البطن", val: measurements.stomach },
              { label: "الصدر", val: measurements.chest },
              { label: "الرقبة", val: measurements.neck },
              { label: "الرجل", val: measurements.leg },
              { label: "الذراع", val: measurements.arm },
              { label: "المؤخرة", val: measurements.butt },
            ].map(m => (
              <div key={m.label} className="p-4 rounded-2xl bg-muted/10 border border-border/30 text-center">
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">{m.label}</p>
                <p className="text-xl font-black text-foreground mt-1">{m.val || "—"}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Photos Block */}
      {photos && (photos.front || photos.side || photos.back || photos.inbody) && (
        <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm p-8">
          <BlockTitle icon={<Camera className="w-4 h-4" />} text="الصور الشخصية" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "front", label: "أمامي" },
              { key: "side", label: "جانبي" },
              { key: "back", label: "خلفي" },
              { key: "inbody", label: "InBody" },
            ].filter(p => (photos as any)[p.key]).map(p => (
              <a key={p.key} href={(photos as any)[p.key]} target="_blank" rel="noopener noreferrer" className="group relative rounded-2xl overflow-hidden border-2 border-border/40 bg-muted/10 aspect-square">
                <img src={(photos as any)[p.key]} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[10px] font-black backdrop-blur-sm">
                  {p.label}
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Food Preferences Block */}
      {(proteinSources?.length > 0 || carbSources?.length > 0 || fatSources?.length > 0) && (
        <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm p-8">
          <BlockTitle icon={<Apple className="w-4 h-4" />} text="تفضيلات التغذية (مرتبة حسب الأفضلية)" />
          <div className="grid sm:grid-cols-3 gap-6">
            {proteinSources?.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-3">مصادر البروتين</p>
                <div className="space-y-1.5">
                  {proteinSources.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/10 border border-border/30">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm font-bold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {carbSources?.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-3">مصادر الكربوهيدرات</p>
                <div className="space-y-1.5">
                  {carbSources.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/10 border border-border/30">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm font-bold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {fatSources?.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-3">مصادر الدهون الصحية</p>
                <div className="space-y-1.5">
                  {fatSources.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/10 border border-border/30">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm font-bold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Health & Eating Habits Block */}
      {(data?.foodAllergies || data?.mealCount || data?.sugarCount || data?.smokingDetails) && (
        <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm p-8">
          <BlockTitle icon={<Heart className="w-4 h-4" />} text="العادات الغذائية والصحية" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "حساسية أو مشاكل مع الأكل", val: data?.foodAllergies },
              { label: "عدد الوجبات في اليوم", val: data?.mealCount },
              { label: "معلقات السكر في اليوم", val: data?.sugarCount },
              { label: "التدخين", val: data?.smokingDetails },
            ].filter(x => x.val).map(item => (
              <div key={item.label} className="p-4 rounded-2xl bg-muted/10 border border-border/30">
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-sm font-bold">{item.val}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Workout Details Block */}
      {(data?.workoutLocation || data?.workoutDaysCount || data?.injuries) && (
        <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm p-8">
          <BlockTitle icon={<Dumbbell className="w-4 h-4" />} text="تفاصيل التمرين" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "مكان التمرين", val: data?.workoutLocation === "gym" ? "جيم" : data?.workoutLocation === "home" ? "المنزل" : data?.workoutLocation },
              { label: "أيام التمرين أسبوعياً", val: data?.workoutDaysCount },
            ].filter(x => x.val).map(item => (
              <div key={item.label} className="p-4 rounded-2xl bg-muted/10 border border-border/30">
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-sm font-bold">{item.val}</p>
              </div>
            ))}
            {data?.injuries && (
              <div className="sm:col-span-2 p-4 rounded-2xl bg-muted/10 border border-border/30">
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">إصابات أو مشاكل جسدية</p>
                <p className="text-sm font-bold">{data.injuries}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Job Details */}
      {data?.jobDetails && (
        <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm p-8">
          <BlockTitle icon={<User className="w-4 h-4" />} text="العمل ونمط الحياة" />
          <div className="p-4 rounded-2xl bg-muted/10 border border-border/30">
            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">طبيعة العمل وعدد ساعاته</p>
            <p className="text-sm font-bold">{data.jobDetails}</p>
          </div>
        </Card>
      )}

      {/* Convert button at bottom */}
      {lead.status === "pending" && (
        <div className="flex justify-center pt-4">
          <Button size="lg" className="h-14 px-10 rounded-[1.5rem] font-black text-base gap-2 bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={goToConvert}>
            <UserPlus className="w-5 h-5" />
            تحويل إلى عميل مشترك
          </Button>
        </div>
      )}
    </div>
  )
}
