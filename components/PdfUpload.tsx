"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { FileUp, X, FileText, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PdfUploadProps {
  label: string
  value?: string | null
  onChange: (url: string | null) => void
  accept?: string
}

export function PdfUpload({ label, value, onChange }: PdfUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentFile, setCurrentFile] = useState<string | null>(value || null)

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("يجب رفع ملف PDF فقط")
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("حجم الملف يجب أن لا يتجاوز 25 ميجابايت")
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
              reject(new Error(data.error || "فشل رفع الملف"))
            } catch {
              reject(new Error("فشل رفع الملف"))
            }
          }
        })
        xhr.addEventListener("error", () => reject(new Error("فشل رفع الملف")))
        xhr.open("POST", "/api/upload")
        xhr.send(formData)
      })

      setCurrentFile(result)
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
    setCurrentFile(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const fileName = currentFile ? decodeURIComponent(currentFile.split("/").pop()?.replace(/^\d+-/, "") || currentFile) : null

  return (
    <div className="space-y-2">
      <label className="text-sm font-black text-foreground">{label}</label>
      {currentFile ? (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/20 group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm truncate">{fileName}</p>
              <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                تم الرفع
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <a href={currentFile} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
              <FileText className="w-4 h-4" />
            </a>
            <button onClick={handleRemove} className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 px-6 py-8 border-2 border-dashed rounded-2xl bg-muted/10 cursor-pointer transition-all",
            dragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/50 hover:border-primary/50 hover:bg-muted/20"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                <FileUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold text-muted-foreground">اسحب ملف PDF هنا أو اضغط للاختيار</span>
                <p className="text-[10px] text-muted-foreground/60 font-bold mt-1">PDF فقط - حد أقصى 25 ميجابايت</p>
              </div>
            </>
          )}
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleChange} className="hidden" />
        </div>
      )}
      {error && <p className="text-xs text-destructive font-bold">{error}</p>}
    </div>
  )
}
