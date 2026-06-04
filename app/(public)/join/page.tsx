"use client"
import React, { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Check, Dumbbell, Star, ArrowLeft, Loader2, Phone, User, Ruler, Weight, Target, Briefcase, Heart, Apple, Camera, ChevronLeft, ChevronRight } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"

const proteinOptions = [
  "صدور دجاج", "وراك دجاج", "كبد وقوانص", "لحم أحمر", "لحم مفروم",
  "كفتة لحم", "سجق", "كبدة", "سمك", "تونة", "سردين", "جمبري", "بيض", "جبن قريش",
]
const carbOptions = [
  "أرز أبيض", "أرز بسمتي", "مكرونة مسلوقة", "شوفان", "توست بني", "عيش شامي", "بطاطس", "بطاطا",
]
const fatOptions = [
  "مكسرات", "فول سوداني", "زبدة لوز", "زبدة فول سوداني", "زيت زيتون", "زيت جوز هند",
]

function MultiRankSelect({ options, value, onChange, label }: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  label: string
}) {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter(i => i !== item))
    } else {
      onChange([...value, item])
    }
  }
  return (
    <div className="space-y-2">
      <label className="font-black text-[10px] uppercase tracking-widest opacity-70">{label}</label>
      <p className="text-[10px] font-medium text-muted-foreground/60 mb-1">اختر حسب التفضيل — أول ما تختاره هو الأعلى تفضيلاً</p>
      <div className="flex flex-wrap gap-2">
        {options.map(item => {
          const idx = value.indexOf(item)
          return (
            <button key={item} type="button" onClick={() => toggle(item)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                idx >= 0
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-muted/10 border-border/40 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {idx >= 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black ml-1.5">{idx + 1}</span>}
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function JoinForm() {
  const searchParams = useSearchParams()
  const preselectedPackage = searchParams.get("package")
  const coachId = searchParams.get("coachId") || ""

  const [packages, setPackages] = useState<any[]>([])
  const [selectedPkg, setSelectedPkg] = useState(preselectedPackage || "")
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [age, setAge] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [jobDetails, setJobDetails] = useState("")
  const [photoFront, setPhotoFront] = useState("")
  const [photoSide, setPhotoSide] = useState("")
  const [photoBack, setPhotoBack] = useState("")
  const [photoInbody, setPhotoInbody] = useState("")
  const [bStomach, setBStomach] = useState("")
  const [bChest, setBChest] = useState("")
  const [bNeck, setBNeck] = useState("")
  const [bLeg, setBLeg] = useState("")
  const [bArm, setBArm] = useState("")
  const [bButt, setBButt] = useState("")

  const [proteinSources, setProteinSources] = useState<string[]>([])
  const [carbSources, setCarbSources] = useState<string[]>([])
  const [fatSources, setFatSources] = useState<string[]>([])

  const [foodAllergies, setFoodAllergies] = useState("")
  const [mealCount, setMealCount] = useState("")
  const [sugarCount, setSugarCount] = useState("")
  const [smokingDetails, setSmokingDetails] = useState("")

  const [workoutLocation, setWorkoutLocation] = useState("")
  const [workoutDaysCount, setWorkoutDaysCount] = useState("")
  const [injuries, setInjuries] = useState("")

  const [error, setError] = useState("")

  useEffect(() => {
    const url = coachId ? `/api/public/packages?coachId=${coachId}` : "/api/public/packages"
    fetch(url)
      .then(r => r.json())
      .then(d => setPackages(d.packages || []))
      .catch(() => {})
  }, [coachId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name.trim() || !phone.trim()) {
      setError("الاسم ورقم الهاتف مطلوبان")
      return
    }
    setSubmitting(true)
    try {
      const extraData = {
        jobDetails,
        photos: { front: photoFront, side: photoSide, back: photoBack, inbody: photoInbody },
        bodyMeasurements: { stomach: bStomach, chest: bChest, neck: bNeck, leg: bLeg, arm: bArm, butt: bButt },
        proteinSources, carbSources, fatSources,
        foodAllergies, mealCount, sugarCount, smokingDetails,
        workoutLocation, workoutDaysCount, injuries,
      }
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, age, weight, height,
          selectedPackageId: selectedPkg || undefined,
          coachId: coachId || undefined,
          data: extraData,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "حدث خطأ")
      }
      setDone(true)
    } catch (err: any) {
      setError(err.message || "فشل الإرسال")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full text-center rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-10 shadow-lg">
          <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black mb-3">تم استلام طلبك!</h2>
          <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed">
            شكراً لك {name} 🎉 سنتواصل معك قريباً على رقم {phone} لمناقشة تفاصيل الاشتراك.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-black text-sm bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
            <ArrowRight className="w-4 h-4" />
            العودة للباقات
          </Link>
        </div>
      </div>
    )
  }

  const sectionTitle = (icon: React.ReactNode, text: string) => (
    <div className="flex items-center gap-2.5 pb-2 mb-4 border-b border-border/20">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
      <h3 className="text-sm font-black tracking-tight">{text}</h3>
    </div>
  )

  const inputClass = "w-full h-12 rounded-xl bg-muted/30 border border-border/40 px-4 font-bold text-sm outline-none focus:border-primary/50 transition-colors"

  const totalSteps = 5
  const isFirst = step === 1
  const isLast = step === totalSteps

  const nextStep = () => {
    setError("")
    if (step === 1) {
      if (!name.trim()) { setError("الاسم مطلوب"); return }
      if (!phone.trim()) { setError("رقم الهاتف مطلوب"); return }
      if (!age) { setError("السن مطلوب"); return }
      if (!weight) { setError("الوزن مطلوب"); return }
      if (!height) { setError("الطول مطلوب"); return }
      if (!jobDetails.trim()) { setError("طبيعة العمل مطلوبة"); return }
      if (!bStomach || !bChest || !bNeck || !bLeg || !bArm || !bButt) { setError("جميع المقاسات مطلوبة"); return }
    }
    if (step === 2) {
      if (proteinSources.length === 0) { setError("اختر على الأقل مصدر بروتين واحد"); return }
      if (carbSources.length === 0) { setError("اختر على الأقل مصدر كربوهيدرات واحد"); return }
      if (fatSources.length === 0) { setError("اختر على الأقل مصدر دهون واحد"); return }
    }
    if (step === 3) {
      if (!foodAllergies.trim()) { setError("حقل الحساسية مطلوب — اكتب لا يوجد إن لم يكن"); return }
      if (!mealCount) { setError("عدد الوجبات مطلوب"); return }
      if (!sugarCount) { setError("معلقات السكر مطلوبة"); return }
      if (!smokingDetails.trim()) { setError("حقل التدخين مطلوب"); return }
    }
    if (step === 4) {
      if (!workoutLocation) { setError("مكان التمرين مطلوب"); return }
      if (!workoutDaysCount) { setError("عدد أيام التمرين مطلوب"); return }
      if (!injuries.trim()) { setError("حقل الإصابات مطلوب — اكتب لا يوجد إن لم يكن"); return }
    }
    setStep(s => s + 1)
  }

  const prevStep = () => { setError(""); setStep(s => s - 1) }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black mb-4 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5" />
            coachflow
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">انضم إلينا</h1>
          <p className="text-sm text-muted-foreground font-medium">املأ بياناتك كاملة لنضع لك خطة مخصصة</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i + 1 === step ? "w-10 bg-primary" : i + 1 < step ? "w-2.5 bg-primary/50" : "w-2.5 bg-muted/30"}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm font-bold text-destructive">{error}</div>
          )}

          {/* Step 1: Basic info & measurements */}
          {step === 1 && (
            <>
              <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8">
                {sectionTitle(<User className="w-4 h-4 text-primary" />, "البيانات الأساسية")}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="font-black text-[10px] uppercase tracking-widest opacity-70">الاسم كاملاً *</label>
                    <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="محمد أحمد" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="font-black text-[10px] uppercase tracking-widest opacity-70">رقم الهاتف *</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="010xxxxxxx" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-black text-[10px] uppercase tracking-widest opacity-70">السن *</label>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} className={inputClass} placeholder="25" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-black text-[10px] uppercase tracking-widest opacity-70">الوزن (كجم) *</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className={inputClass} placeholder="80" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-black text-[10px] uppercase tracking-widest opacity-70">الطول (سم) *</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className={inputClass} placeholder="175" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="font-black text-[10px] uppercase tracking-widest opacity-70">طبيعة العمل وعدد ساعاته *</label>
                    <input value={jobDetails} onChange={e => setJobDetails(e.target.value)} className={inputClass} placeholder="مثلاً: عمل مكتبي 8 ساعات يومياً" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8">
                {sectionTitle(<Camera className="w-4 h-4 text-primary" />, "الصور الشخصية (اختياري)")}
                <p className="text-[10px] font-bold text-muted-foreground/60 mb-4">ارفع صورك من جهازك مباشرة (JPG, PNG, WebP)</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <ImageUpload label="صورة من الأمام" value={photoFront} onChange={(url) => setPhotoFront(url || "")} />
                  <ImageUpload label="صورة من الجنب" value={photoSide} onChange={(url) => setPhotoSide(url || "")} />
                  <ImageUpload label="صورة من الظهر" value={photoBack} onChange={(url) => setPhotoBack(url || "")} />
                  <ImageUpload label="صورة InBody" value={photoInbody} onChange={(url) => setPhotoInbody(url || "")} />
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8">
                {sectionTitle(<Ruler className="w-4 h-4 text-primary" />, "المقاسات (بالسنتيمتر)")}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { label: "البطن", val: bStomach, set: setBStomach },
                    { label: "الصدر", val: bChest, set: setBChest },
                    { label: "الرقبة", val: bNeck, set: setBNeck },
                    { label: "الرجل", val: bLeg, set: setBLeg },
                    { label: "الذراع", val: bArm, set: setBArm },
                    { label: "المؤخرة", val: bButt, set: setBButt },
                  ].map(m => (
                    <div key={m.label} className="space-y-2">
                      <label className="font-black text-[9px] uppercase tracking-widest opacity-70 text-center block">{m.label}</label>
                      <input type="number" value={m.val} onChange={e => m.set(e.target.value)} className="w-full h-10 rounded-xl bg-muted/30 border border-border/40 px-2 font-bold text-sm text-center outline-none focus:border-primary/50 transition-colors" placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Food preferences */}
          {step === 2 && (
            <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8 space-y-6">
              {sectionTitle(<Apple className="w-4 h-4 text-primary" />, "تفضيلات التغذية — رتب حسب التفضيل")}
              <MultiRankSelect label="مصادر البروتين *" options={proteinOptions} value={proteinSources} onChange={setProteinSources} />
              <MultiRankSelect label="مصادر الكربوهيدرات *" options={carbOptions} value={carbSources} onChange={setCarbSources} />
              <MultiRankSelect label="مصادر الدهون الصحية *" options={fatOptions} value={fatSources} onChange={setFatSources} />
            </div>
          )}

          {/* Step 3: Eating & health habits */}
          {step === 3 && (
            <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8">
              {sectionTitle(<Heart className="w-4 h-4 text-primary" />, "العادات الغذائية والصحية")}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="font-black text-[10px] uppercase tracking-widest opacity-70">هل يوجد أي مشكلة مع نوع من الأكل أو نوع يسبب مرض؟ *</label>
                  <input value={foodAllergies} onChange={e => setFoodAllergies(e.target.value)} className={inputClass} placeholder="حساسية لاكتوز، أو لا يوجد" />
                </div>
                <div className="space-y-2">
                  <label className="font-black text-[10px] uppercase tracking-widest opacity-70">كم عدد الوجبات التي تفضل تناولها في اليوم؟ *</label>
                  <input type="number" value={mealCount} onChange={e => setMealCount(e.target.value)} className={inputClass} placeholder="3" />
                </div>
                <div className="space-y-2">
                  <label className="font-black text-[10px] uppercase tracking-widest opacity-70">كم عدد معالق السكر في اليوم؟ *</label>
                  <input type="number" value={sugarCount} onChange={e => setSugarCount(e.target.value)} className={inputClass} placeholder="2" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="font-black text-[10px] uppercase tracking-widest opacity-70">مدخن ولا لأ وكام سيجارة في اليوم تقريباً؟ *</label>
                  <input value={smokingDetails} onChange={e => setSmokingDetails(e.target.value)} className={inputClass} placeholder="مدخن — 10 سجائر يومياً، أو غير مدخن" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Workout details */}
          {step === 4 && (
            <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8">
              {sectionTitle(<Dumbbell className="w-4 h-4 text-primary" />, "تفاصيل التمرين")}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-black text-[10px] uppercase tracking-widest opacity-70">هتتمرن في الجيم ولا في البيت؟ *</label>
                  <select value={workoutLocation} onChange={e => setWorkoutLocation(e.target.value)} className={inputClass + " appearance-none"}>
                    <option value="">اختر</option>
                    <option value="gym">جيم</option>
                    <option value="home">المنزل</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-black text-[10px] uppercase tracking-widest opacity-70">لو هتتمرن في الجيم هتروح كام يوم؟ *</label>
                  <input type="number" value={workoutDaysCount} onChange={e => setWorkoutDaysCount(e.target.value)} className={inputClass} placeholder="3" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="font-black text-[10px] uppercase tracking-widest opacity-70">هل يوجد إصابات أو مشاكل جسدية؟ *</label>
                  <input value={injuries} onChange={e => setInjuries(e.target.value)} className={inputClass} placeholder="لا يوجد، أو اذكر التفاصيل" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Package selection & submit */}
          {step === 5 && (
            <>
              {packages.length > 0 && (
                <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8">
                  {sectionTitle(<Dumbbell className="w-4 h-4 text-primary" />, "اختر باقتك (اختياري)")}
                  <p className="text-[10px] font-bold text-muted-foreground/60 mb-4">يمكنك اختيار الباقة الآن أو لاحقاً بعد التواصل مع المدرب</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {packages.map(pkg => (
                      <button key={pkg.id} type="button" onClick={() => setSelectedPkg(selectedPkg === String(pkg.id) ? "" : String(pkg.id))}
                        className={`p-5 rounded-2xl border text-center transition-all ${selectedPkg === String(pkg.id) ? "border-primary bg-primary/10 shadow-md" : "border-border/40 bg-muted/10 hover:bg-muted/20"}`}>
                        <div className="font-black text-sm">{pkg.name}</div>
                        <div className="text-2xl font-black text-primary mt-1">{pkg.price} <span className="text-[10px] font-bold">ج.م</span></div>
                        <div className="text-[10px] font-bold text-muted-foreground">{pkg.durationMonths === 1 ? "شهري" : `${pkg.durationMonths} شهور`}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-8">
                {sectionTitle(<Check className="w-4 h-4 text-primary" />, "مراجعة البيانات")}
                <p className="text-sm font-medium text-muted-foreground mb-4">تأكد من صحة بياناتك قبل الإرسال. سيتواصل معك المدرب قريباً.</p>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-2 text-sm">
                  <p><span className="font-black opacity-70">الاسم:</span> {name}</p>
                  <p><span className="font-black opacity-70">الهاتف:</span> {phone}</p>
                  <p><span className="font-black opacity-70">السن:</span> {age}</p>
                  <p><span className="font-black opacity-70">الوزن:</span> {weight} كجم</p>
                  <p><span className="font-black opacity-70">الطول:</span> {height} سم</p>
                  <p><span className="font-black opacity-70">طبيعة العمل:</span> {jobDetails}</p>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isFirst ? (
              <Link href="/pricing" className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-black text-sm border border-border/40 bg-card/40 text-muted-foreground hover:bg-muted/20 transition-all">
                <ArrowRight className="w-4 h-4" />
                العودة
              </Link>
            ) : (
              <button type="button" onClick={prevStep} className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-black text-sm border border-border/40 bg-card/40 text-muted-foreground hover:bg-muted/20 transition-all">
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>
            )}
            {isLast ? (
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-black text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</> : <><ArrowLeft className="w-4 h-4" /> إرسال الطلب</>}
              </button>
            ) : (
              <button type="button" onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-black text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-center text-[10px] font-bold text-muted-foreground">
            بالضغط على إرسال، أنت توافق على تواصل المدرب معك عبر الواتساب
          </p>
        </form>

        <div className="text-center mt-6">
          <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowRight className="w-3 h-3" /> العودة للباقات
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-muted/10 border border-border/40 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
        </div>
      </div>
    }>
      <JoinForm />
    </Suspense>
  )
}
