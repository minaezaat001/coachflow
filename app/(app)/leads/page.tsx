"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Check, Phone, Calendar, Weight, Ruler, UserPlus, Star, Dumbbell, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "converted">("all")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadLeads = async () => {
    try {
      const res = await fetch("/api/leads")
      if (res.ok) {
        const d = await res.json()
        setLeads(d.leads || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLeads() }, [])

  const goToDetail = (lead: any) => {
    router.push(`/leads/${lead.id}`)
  }

  const goToConvert = (lead: any) => {
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

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter)
  const pendingCount = leads.filter(l => l.status === "pending").length

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-energy" />
          <span>الإدارة</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>طلبات الاشتراك</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1.5">طلبات الاشتراك</h1>
        <p className="text-sm text-muted-foreground mt-1">{pendingCount} طلب جديد</p>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "converted"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            "h-8 px-4 rounded-lg text-xs transition-all",
            filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}>
            {f === "all" ? "الكل" : f === "pending" ? "جديد" : "تم التحويل"}
            {f === "pending" && pendingCount > 0 && (
              <span className="mr-1.5 px-1 py-0.5 rounded bg-white/20 text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">
            {filter === "pending" ? "كل الطلبات تمت معالجتها" : "لا توجد طلبات اشتراك"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === "pending" ? "عمل رائع! قم بمشاركة رابط التسجيل لاستقبال المزيد" : "شارك رابط التسجيل مع عملائك الجدد"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className={cn(
                "rounded-xl bg-card p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all cursor-pointer hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.06)]",
                lead.status === "pending" ? "border-r-2 border-primary" : "opacity-60"
              )}
              onClick={() => goToDetail(lead)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    lead.status === "pending" ? "bg-warning/10" : "bg-success/10"
                  )}>
                    {lead.status === "pending" ? (
                      <Star className="w-4 h-4 text-warning" />
                    ) : (
                      <Check className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">{lead.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      {lead.age && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{lead.age} سنة</span>}
                      {lead.weight && <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{lead.weight} كجم</span>}
                      {lead.height && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{lead.height} سم</span>}
                      {lead.package && <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{lead.package.name}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lead.status === "pending" && (
                    <Button size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); goToConvert(lead); }}>
                      <UserPlus className="w-3.5 h-3.5" />
                      إضافة كعميل
                    </Button>
                  )}
                  {lead.status === "converted" && (
                    <Badge variant="success">تم التحويل</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
