"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateSubscription, useUpdateSubscription } from "@/hooks/useClientData"
import { useToast } from "@/hooks/use-toast"
import { format, addMonths, addYears } from "date-fns"
import { RefreshCcw, PlusCircle, Calendar, CreditCard, Sparkles, User, Zap, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface RenewalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: { id: string; name: string; subscriptionEndDate?: string; subscriptionType?: string }
  lastSubscription?: any
}

export function RenewalDialog({ open, onOpenChange, client, lastSubscription }: RenewalDialogProps) {
  const { toast } = useToast()
  const createSub = useCreateSubscription()
  const updateSub = useUpdateSubscription()

  const [mode, setMode] = useState<"extend" | "new">("new")
  const [type, setType] = useState(client.subscriptionType || "monthly")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState("")
  const [price, setPrice] = useState("")

  useEffect(() => {
    if (open) {
      let start = new Date()
      if (client.subscriptionEndDate) {
        const lastEnd = new Date(client.subscriptionEndDate)
        if (lastEnd > start) {
          start = new Date(lastEnd)
          start.setDate(start.getDate() + 1)
        }
      }
      setStartDate(start.toISOString().split("T")[0])
      setType(client.subscriptionType || "monthly")
      calculateEndDate(start.toISOString().split("T")[0], client.subscriptionType || "monthly")
      setMode("new")
    }
  }, [open, client])

  const calculateEndDate = (start: string, subType: string) => {
    try {
      const d = new Date(start)
      let end = new Date(d)
      if (subType === "monthly") end = addMonths(d, 1)
      else if (subType === "quarterly") end = addMonths(d, 3)
      else if (subType === "semi-annual") end = addMonths(d, 6)
      else if (subType === "annual") end = addYears(d, 1)

      setEndDate(end.toISOString().split("T")[0])
    } catch (e) {
      console.error(e)
    }
  }

  const handleTypeChange = (val: string) => {
    setType(val)
    calculateEndDate(startDate, val)
  }

  const handleStartChange = (val: string) => {
    setStartDate(val)
    calculateEndDate(val, type)
  }

  const handleRenew = async () => {
    if (!endDate) return toast({ title: "برجاء تحديد تاريخ النهاية", variant: "destructive" })

    const data = {
      type,
      startDate,
      endDate,
      price: price ? parseFloat(price) : undefined,
      status: "active",
    }

    if (mode === "extend" && lastSubscription) {
      updateSub.mutate({ clientId: client.id, subId: lastSubscription.id, data }, {
        onSuccess: () => {
          toast({ title: "✅ تم تمديد الاشتراك بنجاح" })
          onOpenChange(false)
        }
      })
    } else {
      createSub.mutate({ clientId: client.id, data }, {
        onSuccess: () => {
          toast({ title: "✅ تم تجديد الاشتراك بنجاح" })
          onOpenChange(false)
        }
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-[2rem] border-border bg-card/95 backdrop-blur-xl p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">تجديد الاشتراك</DialogTitle>
              <p className="text-[11px] font-bold text-muted-foreground opacity-80 flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5" />
                للمتدرب: {client.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2 relative z-10">
          <div className="flex p-1 bg-muted/30 border border-border/40 rounded-xl gap-1">
            <button
              onClick={() => setMode("new")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                mode === "new" ? "bg-card text-primary shadow-lg" : "text-muted-foreground hover:bg-card/50"
              )}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              باقة جديدة
            </button>
            <button
              disabled={!lastSubscription}
              onClick={() => setMode("extend")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                !lastSubscription && "opacity-30 cursor-not-allowed",
                mode === "extend" ? "bg-card text-primary shadow-lg" : "text-muted-foreground hover:bg-card/50"
              )}
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              تمديد الحالية
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                نوع الباقة
              </Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-11 rounded-lg bg-muted/20 border-border/40 font-bold focus:ring-8 focus:ring-primary/5 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 font-bold">
                  <SelectItem value="monthly">باقة شهرية</SelectItem>
                  <SelectItem value="quarterly">باقة 3 شهور</SelectItem>
                  <SelectItem value="semi-annual">باقة 6 شهور</SelectItem>
                  <SelectItem value="annual">باقة سنوية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  البداية
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="h-11 rounded-lg bg-muted/20 border-border/40 font-bold focus:ring-8 focus:ring-primary/5 text-sm"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  النهاية
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 rounded-lg bg-muted/20 border-border/40 font-bold focus:ring-8 focus:ring-primary/5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                سعر الاشتراك (ج.م)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-11 rounded-lg bg-muted/20 border-border/40 font-bold px-4 text-base focus:ring-8 focus:ring-primary/5"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[9px] font-black uppercase opacity-40">EGP</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="relative z-10 pt-4">
          <Button
            className="w-full h-13 rounded-xl font-black text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            onClick={handleRenew}
            disabled={createSub.isPending || updateSub.isPending}
          >
            {createSub.isPending || updateSub.isPending ? (
              <span className="flex items-center gap-2.5"><RefreshCcw className="w-4 h-4 animate-spin" /> جاري...</span>
            ) : (
              <span className="flex items-center gap-2.5"><Sparkles className="w-4 h-4" /> تأكيد التجديد</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
