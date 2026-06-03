"use client"

import { Card } from "@/components/ui/card"
import type { OnboardingData, BodyMeasurements } from "@/lib/onboarding-types"
import { Briefcase, Apple, Dumbbell, Heart, Ruler, Camera } from "lucide-react"

function formatList(arr: string[] | undefined | null): string {
  if (!arr || arr.length === 0) return "—"
  return arr.join("، ")
}

function measurementsList(m: BodyMeasurements | undefined | null): { label: string; value: string }[] {
  if (!m) return []
  return [
    { label: "البطن", value: m.stomach },
    { label: "الصدر", value: m.chest },
    { label: "الرقبة", value: m.neck },
    { label: "الرجل", value: m.leg },
    { label: "الذراع", value: m.arm },
    { label: "المؤخرة", value: m.butt },
  ].filter(x => x.value)
}

const sections: { title: string; icon: React.ReactNode; render: (d: OnboardingData) => React.ReactNode }[] = [
  {
    title: "البيانات الأساسية والمقاسات",
    icon: <Ruler className="w-4 h-4" />,
    render: (d) => (
      <div className="space-y-3">
        {d.jobDetails && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">طبيعة العمل وعدد ساعاته</p>
            <p className="text-sm font-bold">{d.jobDetails}</p>
          </div>
        )}
        {d.bodyMeasurements && measurementsList(d.bodyMeasurements).length > 0 && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70 mb-2">المقاسات (سم)</p>
            <div className="grid grid-cols-3 gap-2">
              {measurementsList(d.bodyMeasurements).map(m => (
                <div key={m.label} className="p-2 rounded-xl bg-muted/20 border border-border/30 text-center">
                  <p className="text-[10px] font-black text-muted-foreground/60">{m.label}</p>
                  <p className="text-sm font-black">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {d.photos && (d.photos.front || d.photos.side || d.photos.back || d.photos.inbody) && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70 mb-2">الصور الشخصية</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "front", label: "أمامي" },
                { key: "side", label: "جانبي" },
                { key: "back", label: "خلفي" },
                { key: "inbody", label: "InBody" },
              ].filter(p => (d.photos as any)[p.key]).map(p => (
                <a key={p.key} href={(d.photos as any)[p.key]} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center hover:bg-primary/10 transition-all">
                  <Camera className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] font-black">{p.label}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
  },
  {
    title: "تفضيلات التغذية",
    icon: <Apple className="w-4 h-4" />,
    render: (d) => (
      <div className="space-y-3">
        {d.proteinSources && d.proteinSources.length > 0 && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">مصادر البروتين (مرتبة)</p>
            <p className="text-sm font-bold">{formatList(d.proteinSources)}</p>
          </div>
        )}
        {d.carbSources && d.carbSources.length > 0 && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">مصادر الكربوهيدرات (مرتبة)</p>
            <p className="text-sm font-bold">{formatList(d.carbSources)}</p>
          </div>
        )}
        {d.fatSources && d.fatSources.length > 0 && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">مصادر الدهون الصحية (مرتبة)</p>
            <p className="text-sm font-bold">{formatList(d.fatSources)}</p>
          </div>
        )}
      </div>
    ),
  },
  {
    title: "العادات الغذائية والصحية",
    icon: <Heart className="w-4 h-4" />,
    render: (d) => (
      <div className="space-y-3">
        {d.foodAllergies && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">مشاكل أو حساسية من الأكل</p>
            <p className="text-sm font-bold">{d.foodAllergies}</p>
          </div>
        )}
        {d.mealCount && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">عدد الوجبات في اليوم</p>
            <p className="text-sm font-bold">{d.mealCount}</p>
          </div>
        )}
        {d.sugarCount && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">معلقات السكر في اليوم</p>
            <p className="text-sm font-bold">{d.sugarCount}</p>
          </div>
        )}
        {d.smokingDetails && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">التدخين</p>
            <p className="text-sm font-bold">{d.smokingDetails}</p>
          </div>
        )}
      </div>
    ),
  },
  {
    title: "تفاصيل التمرين",
    icon: <Dumbbell className="w-4 h-4" />,
    render: (d) => (
      <div className="space-y-3">
        {d.workoutLocation && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">مكان التمرين</p>
            <p className="text-sm font-bold">{d.workoutLocation === "gym" ? "جيم" : d.workoutLocation === "home" ? "المنزل" : d.workoutLocation}</p>
          </div>
        )}
        {d.workoutDaysCount && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">أيام التمرين أسبوعياً</p>
            <p className="text-sm font-bold">{d.workoutDaysCount}</p>
          </div>
        )}
        {d.injuries && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground/70">إصابات أو مشاكل جسدية</p>
            <p className="text-sm font-bold">{d.injuries}</p>
          </div>
        )}
      </div>
    ),
  },
]

export function OnboardingDisplay({ data }: { data: OnboardingData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map((section) => {
        return (
          <Card key={section.title} className="p-5 rounded-2xl border-border/50 bg-card/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {section.icon}
              </div>
              <h3 className="text-sm font-black text-foreground">{section.title}</h3>
            </div>
            {section.render(data)}
          </Card>
        )
      })}
    </div>
  )
}
