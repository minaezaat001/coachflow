"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Loader2, Wallet, AlertCircle, CheckCircle2 } from "lucide-react"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: number
  clientName: string
  existingPaymentId?: number
  existingAmount?: number
  existingRemaining?: number
  onSuccess?: () => void
}

interface ClientFinance {
  subscriptionTotal: number
  totalPaid: number
  remaining: number
}

function safeNum(v: any, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function formatMoney(n: any): string {
  const safe = safeNum(n)
  return safe.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function PaymentModal({ open, onOpenChange, clientId, clientName, existingPaymentId, existingAmount: _existingAmountProp, existingRemaining: _existingRemainingProp, onSuccess }: PaymentModalProps) {
  const existingAmount = safeNum(_existingAmountProp)
  const existingRemaining = safeNum(_existingRemainingProp)
  const qc = useQueryClient()
  const { toast } = useToast()
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState("cash")
  const [payNote, setPayNote] = useState("")

  const { data: subs, isLoading: loadingSubs } = useQuery({
    queryKey: ["subscriptions", String(clientId)],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions?clientId=${clientId}`)
      if (!res.ok) return []
      const d = await res.json()
      return d.subscriptions || []
    },
    enabled: open && !!clientId,
  })

  const { data: pays, isLoading: loadingPays } = useQuery({
    queryKey: ["payments", String(clientId)],
    queryFn: async () => {
      const res = await fetch(`/api/payments?clientId=${clientId}`)
      if (!res.ok) return []
      const d = await res.json()
      return d.payments || []
    },
    enabled: open && !!clientId,
  })

  const loading = loadingSubs || loadingPays

  const finance: ClientFinance = useMemo(() => {
    const now = new Date().toISOString().split("T")[0]
    const activeSub = (subs || []).find((s: any) => s.status === "active" && s.endDate >= now)
    const subscriptionTotal = safeNum(activeSub?.price)
    const allPays = (pays || []) as any[]
    const totalPaid = allPays.reduce((sum: number, p: any) => {
      if (p.status === "paid" || p.status === "partial") {
        return sum + safeNum(p.amount)
      }
      return sum
    }, 0)
    const remaining = Math.max(0, subscriptionTotal - totalPaid)
    return { subscriptionTotal, totalPaid, remaining }
  }, [subs, pays])

  const initialRemaining = safeNum(finance.remaining)
  const parsedAmount = safeNum(payAmount)
  const remainingAfter = Math.max(0, initialRemaining - parsedAmount)
  const isOverpaying = parsedAmount > initialRemaining && initialRemaining > 0

  useEffect(() => {
    if (open) {
      setPayAmount(initialRemaining > 0 ? String(initialRemaining) : "")
      setPayMethod("cash")
      setPayNote("")
    }
  }, [open, initialRemaining])

  const payMutation = useMutation({
    mutationFn: async () => {
      const newRemaining = Math.max(0, initialRemaining - parsedAmount)
      const newStatus = newRemaining === 0 ? "paid" : "partial"
      if (existingPaymentId) {
        const res = await fetch(`/api/payments/${existingPaymentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            amount: existingAmount + parsedAmount,
            amountRemaining: newRemaining,
            status: newStatus,
            method: payMethod,
            paidAt: new Date().toISOString().split("T")[0],
            notes: payNote || null,
          }),
        })
        if (!res.ok) throw new Error("فشل تحديث الدفعة")
        return res.json()
      }
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          amount: parsedAmount,
          amountRemaining: newRemaining,
          status: newStatus,
          method: payMethod,
          paidAt: new Date().toISOString().split("T")[0],
          notes: payNote || null,
        }),
      })
      if (!res.ok) throw new Error("فشل تسجيل الدفعة")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] })
      qc.invalidateQueries({ queryKey: ["payments", String(clientId)] })
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
      qc.invalidateQueries({ queryKey: ["subscriptions", String(clientId)] })
      qc.invalidateQueries({ queryKey: ["client", String(clientId)] })
      qc.invalidateQueries({ queryKey: ["financialSummary"] })
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] })
      toast({ title: existingPaymentId ? "✅ تم تحصيل المبلغ بنجاح" : "✅ تم تسجيل الدفعة بنجاح" })
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (err: any) => {
      toast({ title: "حدث خطأ", description: err.message, variant: "destructive" })
    },
  })

  const canSubmit = parsedAmount > 0 && !isOverpaying && !payMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border bg-card/95 backdrop-blur-xl sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-black mb-1">
            {existingPaymentId ? "تحصيل مبلغ متبقي" : "تسجيل دفعة جديدة"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/0 border border-primary/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">العميل</p>
              <p className="text-sm font-black text-foreground">{clientName}</p>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-primary/10">
                <div><div className="h-4 w-16 rounded bg-muted/40 animate-pulse" /></div>
                <div><div className="h-4 w-16 rounded bg-muted/40 animate-pulse" /></div>
                <div><div className="h-4 w-16 rounded bg-muted/40 animate-pulse" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-primary/10">
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">الاشتراك</p>
                  <p className="text-xs font-black text-foreground">{formatMoney(finance.subscriptionTotal)} ج.م</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">المدفوع</p>
                  <p className="text-xs font-black text-emerald-500">{formatMoney(finance.totalPaid)} ج.م</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">المتبقي</p>
                  <p className="text-xs font-black text-red-500">{formatMoney(initialRemaining)} ج.م</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">المبلغ المطلوب تحصيله</Label>
              {initialRemaining > 0 && (
                <button
                  type="button"
                  onClick={() => setPayAmount(String(initialRemaining))}
                  className="text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-all"
                >
                  تحصيل الكامل
                </button>
              )}
            </div>
            <Input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0"
              className="h-12 rounded-xl bg-muted/20 border-border/40 text-lg font-black px-4 text-center"
            />
          </div>

          {parsedAmount > 0 && !isOverpaying && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-muted-foreground">المتبقي بعد الدفع</span>
              </div>
              <span className={cn(
                "text-sm font-black",
                remainingAfter === 0 ? "text-emerald-500" : "text-amber-500"
              )}>
                {formatMoney(remainingAfter)} ج.م
                {remainingAfter === 0 && " (تم السداد)"}
              </span>
            </div>
          )}

          {isOverpaying && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[10px] font-black text-red-500">
                المبلغ يتجاوز المتبقي! أقصى ممكن: {formatMoney(initialRemaining)} ج.م
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">وسيلة الدفع</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/40 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl font-bold">
                  <SelectItem value="vodafone-cash">فودافون كاش</SelectItem>
                  <SelectItem value="instapay">InstaPay</SelectItem>
                  <SelectItem value="cash">كاش</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">ملاحظة (اختياري)</Label>
              <Input
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="ملاحظة..."
                className="h-11 rounded-xl bg-muted/20 border-border/40 font-bold"
              />
            </div>
          </div>

          <Button
            className="w-full h-13 rounded-xl font-black text-base shadow-lg"
            onClick={() => payMutation.mutate()}
            disabled={!canSubmit}
          >
            {payMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري...</>
            ) : (
              <><Wallet className="w-5 h-5 ml-2" /> {existingPaymentId ? "تأكيد التحصيل" : "تسجيل الدفعة"}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


