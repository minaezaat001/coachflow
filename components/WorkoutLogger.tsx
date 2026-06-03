"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2 } from "lucide-react"

const schema = z.object({
  exercises: z.array(z.object({
    exerciseName: z.string().min(1, "مطلوب"),
    date: z.string().min(1, "مطلوب"),
    sets: z.array(z.object({
      reps: z.string().transform(Number),
      weight: z.string().transform(Number),
    })),
  }))
})

export function WorkoutLogger({ clientId, coachId, onComplete }: { clientId: string, coachId: string | null, onComplete: () => void }) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { exercises: [{ exerciseName: "", date: new Date().toISOString().split("T")[0], sets: [{ reps: "", weight: "" }, { reps: "", weight: "" }, { reps: "", weight: "" }] }] }
  })
  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({ control, name: "exercises" })
  const { toast } = useToast()

  const onSubmit = async (data: any) => {
    try {
      for (const exercise of data.exercises) {
        const res = await fetch(`/api/workout-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseName: exercise.exerciseName,
            date: exercise.date,
            sets: JSON.stringify(exercise.sets),
            clientId,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "فشل تسجيل التمرين")
        }
      }
      toast({ title: "تم تسجيل التمارين بنجاح" })
      onComplete()
    } catch (error) {
      toast({ title: "خطأ", description: (error as Error).message, variant: "destructive" })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {exerciseFields.map((exercise, eIndex) => (
        <div key={exercise.id} className="p-4 border rounded space-y-3">
          <div className="flex gap-2">
            <Input {...register(`exercises.${eIndex}.exerciseName`)} placeholder="اسم التمرين" />
            <Input {...register(`exercises.${eIndex}.date`)} type="date" />
            <Button type="button" variant="destructive" onClick={() => removeExercise(eIndex)}><Trash2 className="w-4 h-4" /></Button>
          </div>
          <ExerciseSets control={control} eIndex={eIndex} register={register} />
        </div>
      ))}
      <Button type="button" onClick={() => appendExercise({ exerciseName: "", date: new Date().toISOString().split("T")[0], sets: [{ reps: "", weight: "" }, { reps: "", weight: "" }, { reps: "", weight: "" }] })}><Plus className="w-4 h-4 ml-2" />إضافة تمرين</Button>
      <Button type="submit" disabled={isSubmitting}>حفظ التمارين</Button>
    </form>
  )
}

function ExerciseSets({ control, eIndex, register }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `exercises.${eIndex}.sets` })
  return (
    <div className="space-y-2">
      {fields.map((set, sIndex) => (
        <div key={set.id} className="flex gap-2 items-center">
          <span className="text-sm font-medium w-24">مجموعة {sIndex + 1}</span>
          <Input {...register(`exercises.${eIndex}.sets.${sIndex}.reps`)} type="number" placeholder="العدات" />
          <Input {...register(`exercises.${eIndex}.sets.${sIndex}.weight`)} type="number" placeholder="الوزن" />
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(sIndex)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ reps: "", weight: "" })}><Plus className="w-4 h-4 ml-2" />إضافة مجموعة</Button>
    </div>
  )
}
