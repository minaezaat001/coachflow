"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, Package as PackageIcon, Edit3, Trash2, ToggleLeft, ToggleRight,
  Users, Calendar, DollarSign, Clock, FileText, X, Loader2, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface PackageItem {
  id: number
  name: string
  price: number
  durationMonths: number
  defaultCheckInFrequency: number
  packageType: string
  isActive: boolean
  maxClients: number | null
  description: string | null
  createdAt: string
}

const typeLabels: Record<string, string> = {
  training: "تدريب فقط",
  nutrition: "تغذية فقط",
  both: "تدريب وتغذية",
}

const typeBadgeVariants: Record<string, "destructive" | "warning" | "secondary" | "default"> = {
  training: "secondary",
  nutrition: "warning",
  both: "default",
}

const frequencyLabels: Record<number, string> = {
  1: "يومي",
  7: "أسبوعي",
  10: "كل 10 أيام",
  14: "كل أسبوعين",
}

export default function PackagesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editPkg, setEditPkg] = useState<PackageItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    durationMonths: "1",
    defaultCheckInFrequency: "7",
    packageType: "both",
    isActive: true,
    maxClients: "",
    description: "",
  })

  const { data, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const res = await fetch("/api/packages?all=true")
      const data = await res.json()
      return (data.packages || []) as PackageItem[]
    },
  })

  const packages = data || []

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] })
      toast({ title: "تم إنشاء الباقة بنجاح" })
      resetForm()
    },
    onError: (err: Error) => {
      toast({ title: "فشل إنشاء الباقة", description: err.message, variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] })
      toast({ title: "تم تحديث الباقة بنجاح" })
      resetForm()
    },
    onError: (err: Error) => {
      toast({ title: "فشل تحديث الباقة", description: err.message, variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] })
      toast({ title: "تم حذف الباقة" })
    },
    onError: (err: Error) => {
      toast({ title: "فشل حذف الباقة", description: err.message, variant: "destructive" })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] })
    },
  })

  function resetForm() {
    setShowForm(false)
    setEditPkg(null)
    setFormData({
      name: "",
      price: "",
      durationMonths: "1",
      defaultCheckInFrequency: "7",
      packageType: "both",
      isActive: true,
      maxClients: "",
      description: "",
    })
  }

  function openEdit(pkg: PackageItem) {
    setEditPkg(pkg)
    setFormData({
      name: pkg.name,
      price: String(pkg.price),
      durationMonths: String(pkg.durationMonths),
      defaultCheckInFrequency: String(pkg.defaultCheckInFrequency),
      packageType: pkg.packageType,
      isActive: pkg.isActive,
      maxClients: pkg.maxClients ? String(pkg.maxClients) : "",
      description: pkg.description || "",
    })
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...formData,
      price: formData.price,
      durationMonths: formData.durationMonths,
      defaultCheckInFrequency: formData.defaultCheckInFrequency,
    }
    if (editPkg) {
      updateMutation.mutate({ id: editPkg.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
        <span>●</span>
        <span>باقات الاشتراك</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">باقات الاشتراك</h1>
          <p className="text-sm text-muted-foreground mt-1">إنشاء وإدارة باقات التدريب والتغذية</p>
        </div>
        <Button
          onClick={() => { setEditPkg(null); setFormData({ name: "", price: "", durationMonths: "1", defaultCheckInFrequency: "7", packageType: "both", isActive: true, maxClients: "", description: "" }); setShowForm(true) }}
        >
          <Plus className="w-5 h-5" />
          باقة جديدة
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <PackageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-1">لا توجد باقات بعد</h3>
          <p className="text-sm text-muted-foreground/60 mb-6">أنشئ أول باقة اشتراك لعملائك</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            إنشاء باقة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={cn(
                "rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all duration-300 group",
                !pkg.isActive && "opacity-50"
              )}
            >
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    <Badge variant={typeBadgeVariants[pkg.packageType] || "secondary"}>
                      {typeLabels[pkg.packageType] || pkg.packageType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="w-8 h-8 rounded-lg bg-muted/10 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف الباقة؟")) deleteMutation.mutate(pkg.id)
                      }}
                      className="w-8 h-8 rounded-lg bg-muted/10 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-3xl font-bold">
                  {pkg.price.toLocaleString()}
                  <span className="text-sm font-medium text-muted-foreground mr-1">ج.م</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/10">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">المدة</p>
                      <p className="text-sm font-medium">{pkg.durationMonths} شهر{pkg.durationMonths > 1 ? "" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/10">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">متابعة</p>
                      <p className="text-sm font-medium">{frequencyLabels[pkg.defaultCheckInFrequency] || `كل ${pkg.defaultCheckInFrequency} يوم`}</p>
                    </div>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
                    {pkg.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {pkg.maxClients ? `الحد الأقصى: ${pkg.maxClients}` : "غير محدود"}
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium transition-all",
                      pkg.isActive ? "text-emerald-500" : "text-muted-foreground"
                    )}
                  >
                    {pkg.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {pkg.isActive ? "نشطة" : "متوقفة"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editPkg ? "تعديل الباقة" : "إنشاء باقة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>اسم الباقة</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="باقة التنشيف الـ VIP"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (ج.م)</Label>
                <Input
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  type="number"
                  placeholder="1500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>المدة (بالشهر)</Label>
                <Select
                  value={formData.durationMonths}
                  onValueChange={(v) => setFormData({ ...formData, durationMonths: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">شهر</SelectItem>
                    <SelectItem value="3">3 أشهر</SelectItem>
                    <SelectItem value="6">6 أشهر</SelectItem>
                    <SelectItem value="12">سنة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الباقة</Label>
                <Select
                  value={formData.packageType}
                  onValueChange={(v) => setFormData({ ...formData, packageType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">تدريب فقط</SelectItem>
                    <SelectItem value="nutrition">تغذية فقط</SelectItem>
                    <SelectItem value="both">تدريب وتغذية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الدورية الافتراضية للمتابعة</Label>
                <Select
                  value={formData.defaultCheckInFrequency}
                  onValueChange={(v) => setFormData({ ...formData, defaultCheckInFrequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">يومي</SelectItem>
                    <SelectItem value="7">أسبوعي</SelectItem>
                    <SelectItem value="10">كل 10 أيام</SelectItem>
                    <SelectItem value="14">كل أسبوعين</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأقصى للعملاء</Label>
                <Input
                  value={formData.maxClients}
                  onChange={(e) => setFormData({ ...formData, maxClients: e.target.value })}
                  type="number"
                  placeholder="غير محدود"
                />
              </div>
              <div className="space-y-2 flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className="text-sm font-medium">الباقة نشطة</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر لمميزات الباقة..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editPkg ? "حفظ التعديلات" : "إنشاء الباقة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
