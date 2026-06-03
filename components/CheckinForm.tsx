"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Camera } from "lucide-react"
import { ImageUpload } from "./ImageUpload"
import { cn } from "@/lib/utils"

const schema = z.object({
  weight: z.string().transform(Number),
  bodyFat: z.string().optional(),
  waist: z.string().optional(),
  chest: z.string().optional(),
  neck: z.string().optional(),
  leg: z.string().optional(),
  arm: z.string().optional(),
  glutes: z.string().optional(),
  adherence: z.string().transform(Number).refine(v => v >= 1 && v <= 10, "يجب أن يكون بين 1 و 10"),
  notes: z.string().optional(),
  planFeedback: z.string().optional(),
  improvementsView: z.string().optional(),
})

export function CheckinForm({ clientId, coachId, clientToken, onComplete }: { clientId: string, coachId: string | null, clientToken?: string | null, onComplete: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const { toast } = useToast()
  const [frontPhoto, setFrontPhoto] = React.useState<string | null>(null)
  const [sidePhoto, setSidePhoto] = React.useState<string | null>(null)
  const [backPhoto, setBackPhoto] = React.useState<string | null>(null)
  const [inbodyPhoto, setInbodyPhoto] = React.useState<string | null>(null)

  const onSubmit = async (data: any) => {
    try {
      const payload: any = {
        clientId,
        token: clientToken || undefined,
        recordedAt: new Date().toISOString(),
        weight: data.weight,
        adherence: data.adherence,
        notes: data.notes || null,
        planFeedback: data.planFeedback || null,
        improvementsView: data.improvementsView || null,
        frontPhoto: frontPhoto || null,
        sidePhoto: sidePhoto || null,
        backPhoto: backPhoto || null,
        inbodyPhoto: inbodyPhoto || null,
      }

      if (data.bodyFat) payload.bodyFat = parseFloat(data.bodyFat)
      if (data.waist) payload.waist = parseFloat(data.waist)
      if (data.chest) payload.chest = parseFloat(data.chest)
      if (data.neck) payload.neck = parseFloat(data.neck)
      if (data.leg) payload.leg = parseFloat(data.leg)
      if (data.arm) payload.arm = parseFloat(data.arm)
      if (data.glutes) payload.glutes = parseFloat(data.glutes)

      const res = await fetch(`/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "فشل إرسال المتابعة")
      }
      toast({ title: "تم إرسال المتابعة بنجاح" })
      onComplete()
    } catch (error) {
      toast({ title: "خطأ", description: (error as Error).message, variant: "destructive" })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photos Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-black">الصور (اختياري)</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ImageUpload label="الأمام" value={frontPhoto} onChange={setFrontPhoto} />
          <ImageUpload label="الجنب" value={sidePhoto} onChange={setSidePhoto} />
          <ImageUpload label="الظهر" value={backPhoto} onChange={setBackPhoto} />
          <ImageUpload label="InBody" value={inbodyPhoto} onChange={setInbodyPhoto} />
        </div>
      </div>

      {/* Body Measurements Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <span className="text-blue-500 font-black text-sm">سم</span>
          </div>
          <h3 className="text-sm font-black">المقاسات (سم)</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-black">الوزن (كجم) *</Label>
            <Input {...register("weight")} type="number" step="0.1" placeholder="75.5" className="rounded-xl h-11 border-border/50" />
            {errors.weight && <p className="text-xs text-destructive font-bold">الوزن مطلوب</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black">نسبة الدهون</Label>
            <Input {...register("bodyFat")} type="number" step="0.1" placeholder="15.2" className="rounded-xl h-11 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black">البطن</Label>
            <Input {...register("waist")} type="number" step="0.1" placeholder="85" className="rounded-xl h-11 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black">الصدر</Label>
            <Input {...register("chest")} type="number" step="0.1" placeholder="100" className="rounded-xl h-11 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black">الرقبة</Label>
            <Input {...register("neck")} type="number" step="0.1" placeholder="38" className="rounded-xl h-11 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black">الرجل</Label>
            <Input {...register("leg")} type="number" step="0.1" placeholder="55" className="rounded-xl h-11 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black">الذراع</Label>
            <Input {...register("arm")} type="number" step="0.1" placeholder="35" className="rounded-xl h-11 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black">المؤخرة</Label>
            <Input {...register("glutes")} type="number" step="0.1" placeholder="95" className="rounded-xl h-11 border-border/50" />
          </div>
        </div>
      </div>

      {/* Adherence */}
      <div className="space-y-1.5">
        <Label className="text-xs font-black">مستوى الالتزام (1-10) *</Label>
        <Input {...register("adherence")} type="number" min="1" max="10" placeholder="مثال: 8" className="rounded-xl h-11 border-border/50" />
        {errors.adherence && <p className="text-xs text-destructive font-bold">{errors.adherence.message as string}</p>}
      </div>

      {/* Feedback */}
      <div className="space-y-1.5">
        <Label className="text-xs font-black">رأيك في الخطة الحالية</Label>
        <Textarea {...register("planFeedback")} placeholder="هل هناك شيء غير مريح في الخطة؟" rows={2} className="rounded-2xl border-border/50" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-black">ما الذي تحسن من وجهة نظرك؟</Label>
        <Textarea {...register("improvementsView")} placeholder="جودة الحركة، القوة، المرونة..." rows={2} className="rounded-2xl border-border/50" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-black">ملاحظات إضافية</Label>
        <Textarea {...register("notes")} placeholder="ملاحظات عن الأسبوع" rows={2} className="rounded-2xl border-border/50" />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-black gap-2">
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        إرسال المتابعة
      </Button>
    </form>
  )
}