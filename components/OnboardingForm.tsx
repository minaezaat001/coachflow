"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const schema = z.object({
  jobTitle: z.string().min(1, "مطلوب"),
  workNature: z.enum(["active", "sitting", "mixed"]),
  dailyRoutine: z.string().min(1, "مطلوب"),
  lifestyle: z.string().min(1, "مطلوب"),
  workoutLocation: z.enum(["home", "gym"]),
  workoutDays: z.string().transform(Number),
  workoutTime: z.string().optional(),
  favoriteFoods: z.string().min(1, "مطلوب"),
  dislikedFoods: z.string().min(1, "مطلوب"),
  dietaryRestrictions: z.string().min(1, "مطلوب"),
  eatingHabits: z.string().min(1, "مطلوب"),
  injuries: z.string().optional(),
  medicalConditions: z.string().optional(),
  mainGoal: z.enum(["fat-loss", "muscle-gain", "fitness"]),
})

export function OnboardingForm({ clientId, coachId, clientToken, onComplete }: { clientId: string, coachId: string | null, clientToken?: string | null, onComplete: () => void }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const { toast } = useToast()

  const onSubmit = async (data: any) => {
    try {
      const { clientId: _, ...formData } = data
      const res = await fetch(`/api/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, token: clientToken || undefined, data: formData }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save onboarding")
      }
      toast({ title: "تم حفظ البيانات بنجاح" })
      onComplete()
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حفظ البيانات: " + (error as Error).message, variant: "destructive" })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">استمارة البيانات الأولية</h2>
      <Input {...register("jobTitle")} placeholder="المسمى الوظيفي" />
      <Select onValueChange={(v) => setValue("workNature", v as any)}>
        <SelectTrigger><SelectValue placeholder="طبيعة العمل" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="active">نشط</SelectItem>
          <SelectItem value="sitting">مكتبي (جالس)</SelectItem>
          <SelectItem value="mixed">مختلط</SelectItem>
        </SelectContent>
      </Select>
      <Textarea {...register("dailyRoutine")} placeholder="وصف روتينك اليومي" />
      <Textarea {...register("lifestyle")} placeholder="وصف نمط حياتك وشخصيتك" />
      <Select onValueChange={(v) => setValue("workoutLocation", v as any)}>
        <SelectTrigger><SelectValue placeholder="مكان التمرين المفضل" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="home">المنزل</SelectItem>
          <SelectItem value="gym">الجيم</SelectItem>
        </SelectContent>
      </Select>
      <Input {...register("workoutDays")} type="number" placeholder="عدد أيام التمرين في الأسبوع" />
      <Input {...register("workoutTime")} placeholder="وقت التمرين المفضل (اختياري)" />
      <Input {...register("favoriteFoods")} placeholder="الأطعمة المفضلة" />
      <Input {...register("dislikedFoods")} placeholder="الأطعمة التي لا تحبها" />
      <Input {...register("dietaryRestrictions")} placeholder="حساسية أو قيود غذائية" />
      <Textarea {...register("eatingHabits")} placeholder="عاداتك الغذائية" />
      <Input {...register("injuries")} placeholder="إصابات (اختياري)" />
      <Input {...register("medicalConditions")} placeholder="حالات طبية (اختياري)" />
      <Select onValueChange={(v) => setValue("mainGoal", v as any)}>
        <SelectTrigger><SelectValue placeholder="الهدف الرئيسي" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="fat-loss">تخسيس</SelectItem>
          <SelectItem value="muscle-gain">تضخيم</SelectItem>
          <SelectItem value="fitness">لياقة</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isSubmitting}>حفظ وإتمام</Button>
    </form>
  )
}
