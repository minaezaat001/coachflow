"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Check, Dumbbell, Utensils, ArrowLeft, Sparkles, Users, Star } from "lucide-react"

const typeLabels: Record<string, string> = { training: "تدريب", nutrition: "تغذية", both: "تدريب + تغذية" }
const typeIcons: Record<string, React.ReactNode> = {
  training: <Dumbbell className="w-5 h-5" />,
  nutrition: <Utensils className="w-5 h-5" />,
  both: <Sparkles className="w-5 h-5" />,
}

export default function CoachPricingPage() {
  const params = useParams()
  const coachId = params?.coachId as string
  const [packages, setPackages] = useState<any[]>([])
  const [coachName, setCoachName] = useState("المدرب")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!coachId) return
    Promise.all([
      fetch(`/api/public/packages?coachId=${coachId}`).then(r => r.json()),
      fetch(`/api/public/coach?coachId=${coachId}`).then(r => r.json()),
    ]).then(([pkgData, coachData]) => {
      setPackages(pkgData.packages || [])
      if (coachData.name) setCoachName(coachData.name)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [coachId])

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black mb-6 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5" />
            coachflow
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">اختر باقتك المثالية</h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl mx-auto">
            {`خطط تدريب وتغذية مخصصة تناسب أهدافك مع متابعة يومية من المدرب ${coachName}`}
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl border border-border/40 bg-card/30 p-6 space-y-4 animate-pulse">
                <div className="h-6 w-24 bg-muted rounded-lg" />
                <div className="h-10 w-32 bg-muted rounded-xl" />
                <div className="space-y-2"><div className="h-4 bg-muted rounded-lg" /><div className="h-4 bg-muted rounded-lg w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-[2rem] bg-muted/10 border border-dashed border-border/50 flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-black text-muted-foreground">لا توجد باقات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <div key={pkg.id} className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8 flex flex-col hover:scale-[1.02] transition-all duration-300 animate-fade-up relative overflow-hidden group" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {typeIcons[pkg.packageType] || <Dumbbell className="w-6 h-6 text-primary" />}
                </div>
                <h3 className="text-xl font-black mb-1">{pkg.name}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">{typeLabels[pkg.packageType] || pkg.packageType}</p>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-black">{pkg.price}</span>
                  <span className="text-sm font-bold text-muted-foreground mr-1">ج.م</span>
                  <span className="text-xs font-bold text-muted-foreground mr-2">{pkg.durationMonths === 1 ? "/ شهرياً" : `/${pkg.durationMonths} شهور`}</span>
                </div>
                {pkg.description && <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-6">{pkg.description}</p>}
                <div className="space-y-3 mb-8">
                  {["متابعة كل " + (pkg.defaultCheckInFrequency || 7) + " أيام", pkg.packageType === "training" ? "برنامج تدريب مخصص" : pkg.packageType === "nutrition" ? "نظام غذائي مخصص" : "تدريب + تغذية", "تقارير دورية للقياسات"].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
                <div className="mt-auto">
                  <Link href={`/join?package=${pkg.id}&coachId=${coachId}`} className="w-full h-12 rounded-xl font-black text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    اشترك الآن
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{`مدربك الشخصي: ${coachName} — تواصل عبر واتساب للمزيد`}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
