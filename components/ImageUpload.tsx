"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  label: string
  value?: string | null
  onChange: (url: string | null) => void
}

export function ImageUpload({ label, value, onChange }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(value || null)

  const handleUpload = async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setError("يجب رفع صورة فقط (JPG, PNG, WebP)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت")
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      const result = await new Promise<string>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText)
            resolve(data.url)
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              reject(new Error(data.error || "فشل رفع الصورة"))
            } catch {
              reject(new Error("فشل رفع الصورة"))
            }
          }
        })
        xhr.addEventListener("error", () => reject(new Error("فشل رفع الصورة")))
        xhr.open("POST", "/api/upload")
        xhr.send(formData)
      })

      setCurrentUrl(result)
      onChange(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleRemove = () => {
    setCurrentUrl(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <label className="font-black text-[10px] uppercase tracking-widest opacity-70">{label}</label>
      {currentUrl ? (
        <div className="relative group rounded-xl overflow-hidden border-2 border-border/40 bg-muted/10">
          <img src={currentUrl} alt={label} className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/90 flex items-center justify-center text-foreground hover:bg-white transition-all">
              <ImageIcon className="w-4 h-4" />
            </a>
            <button onClick={handleRemove} className="w-9 h-9 rounded-lg bg-destructive/90 text-white flex items-center justify-center hover:bg-destructive transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-black backdrop-blur-sm">
            {label}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl bg-muted/10 cursor-pointer transition-all",
            dragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/40 hover:border-primary/50 hover:bg-muted/20"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs font-bold text-primary">{progress}%</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">اضغط لرفع صورة</span>
              <span className="text-[9px] text-muted-foreground/50 font-bold">JPG, PNG, WebP - 5 ميجابايت حد أقصى</span>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleChange} className="hidden" />
        </div>
      )}
      {error && <p className="text-xs text-destructive font-bold">{error}</p>}
    </div>
  )
}
