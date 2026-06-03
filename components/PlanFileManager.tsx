"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { FileText, Upload, Trash2, ExternalLink, MessageCircle, Loader2, Replace } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PlanFileManagerProps {
  clientId: number
  clientPhone: string
  field: "dietPlanUrl" | "workoutPlanUrl"
  currentUrl: string | null
  title: string
  icon: React.ReactNode
  accent: "energy" | "primary"
  onUpdate: () => void
}

export function PlanFileManager({
  clientId,
  clientPhone,
  field,
  currentUrl,
  title,
  icon,
  accent,
  onUpdate,
}: PlanFileManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const accentStyles = {
    energy: {
      bg: "bg-energy/10",
      text: "text-energy",
      border: "border-energy/20",
      hover: "hover:bg-energy/10",
    },
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      hover: "hover:bg-primary/10",
    },
  }

  const a = accentStyles[accent]

  const handleUpload = async (file: File) => {
    if (!file) return

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "يجب رفع ملف PDF أو صورة (JPG, PNG, WebP) فقط", variant: "destructive" })
      return
    }

    const maxSize = file.type === "application/pdf" ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMb = maxSize / (1024 * 1024)
      toast({ title: `حجم الملف يجب أن لا يتجاوز ${maxMb} ميجابايت`, variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("clientId", String(clientId))
      formData.append("field", field)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || "فشل رفع الملف")
      }

      const { url } = await uploadRes.json()

      const patchRes = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: url }),
      })

      if (!patchRes.ok) {
        throw new Error("فشل تحديث بيانات العميل")
      }

      toast({ title: `تم رفع ${title}` })
      onUpdate()
    } catch (error: any) {
      toast({ title: error.message || "حدث خطأ", variant: "destructive" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (replaceInputRef.current) replaceInputRef.current.value = ""
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: null }),
      })

      if (!res.ok) throw new Error("فشل حذف الملف")

      toast({ title: `تم حذف ${title}` })
      onUpdate()
    } catch (error: any) {
      toast({ title: error.message || "حدث خطأ", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const fileName = currentUrl ? decodeURIComponent(currentUrl.split("/").pop()?.replace(/^\d+-/, "") || "الملف") : ""

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />

      {currentUrl ? (
        <div className="space-y-2.5">
          <div className={cn("flex items-center gap-3 p-3.5 rounded-xl border", a.border, a.bg)}>
            <div className={cn("w-9 h-9 rounded-lg bg-card border shrink-0 flex items-center justify-center", a.border)}>
              <FileText className={cn("w-4.5 h-4.5", a.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{fileName}</p>
              <p className="text-[10px] text-muted-foreground">
                {currentUrl.endsWith(".pdf") ? "PDF" : "صورة"}
              </p>
            </div>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="w-7 h-7" title="عرض">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex-1"
              onClick={() => replaceInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Replace className="w-3.5 h-3.5" />
              )}
              استبدال
            </Button>

            <a
              href={`https://wa.me/2${clientPhone}?text=${encodeURIComponent(`مرحباً! هذا رابط ${title} الخاص بك:\n${window.location.origin}${currentUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="h-8 text-xs w-full">
                <MessageCircle className="w-3.5 h-3.5" />
                واتساب
              </Button>
            </a>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={handleDelete}
              disabled={deleting}
              title="حذف"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full rounded-xl border-2 border-dashed p-8 text-center transition-all",
            "border-border hover:border-primary/40 hover:bg-muted/30",
            "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">جاري الرفع...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", a.bg)}>
                <Upload className={cn("w-5 h-5", a.text)} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">رفع {title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF أو صورة — حد أقصى 10 ميجابايت</p>
              </div>
            </div>
          )}
        </button>
      )}
    </div>
  )
}
