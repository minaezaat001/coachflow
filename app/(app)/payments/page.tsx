"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PaymentModal } from "@/components/PaymentModal";
import { Plus, Trash2, TrendingUp, Wallet, AlertCircle, DollarSign, Calendar, CreditCard, ArrowUpRight, ArrowDownRight, Target, Filter } from "lucide-react";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS: Record<string, string> = {
  "vodafone-cash": "فودافون كاش",
  instapay: "InstaPay",
  cash: "كاش",
  other: "أخرى",
};

const CHART_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

const paymentStatusConfig: Record<string, { variant: "default" | "destructive" | "warning"; label: string }> = {
  paid: { variant: "default", label: "مدفوع" },
  unpaid: { variant: "destructive", label: "غير مدفوع" },
  partial: { variant: "warning", label: "جزئي" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-xs">
        <p className="font-medium mb-1 text-muted-foreground">{label}</p>
        <p className="text-base font-semibold text-foreground">{payload[0].value.toLocaleString()} ج.م</p>
      </div>
    );
  }
  return null;
}

function safeDate(d: string) {
  try { return format(new Date(d), "dd MMM yyyy", { locale: arEG }); } catch { return d; }
}

const fetchAllPayments = async () => {
  const res = await fetch("/api/payments");
  if (!res.ok) throw new Error("فشل جلب المدفوعات");
  const data = await res.json();
  return (data.payments || []).map((p: any) => ({
    ...p,
    clientName: p.client?.name,
    clientPhone: p.client?.phone,
  }));
};

const fetchFinancialSummary = async (): Promise<any> => {
  const res = await fetch("/api/dashboard/financial");
  if (!res.ok) throw new Error("فشل جلب الملخص المالي");
  const data = await res.json();
  return {
    totalRevenue: data.totalRevenue ?? 0,
    monthlyRevenue: data.monthlyRevenue ?? 0,
    unpaidAmount: data.unpaidAmount ?? 0,
    expectedRevenue: data.expectedRevenue ?? 0,
    revenueByMethod: Array.isArray(data.revenueByMethod) ? data.revenueByMethod : [],
    monthlyTrend: Array.isArray(data.monthlyTrend) ? data.monthlyTrend : [],
  };
};

const fetchClients = async () => {
  const res = await fetch("/api/clients");
  if (!res.ok) throw new Error("فشل جلب العملاء");
  const data = await res.json();
  return data.clients || [];
};

export default function Payments() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ id: string, clientId: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [settleInfo, setSettleInfo] = useState<any | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["allPayments"],
    queryFn: fetchAllPayments,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: financial, isLoading: loadingFinancial } = useQuery({
    queryKey: ["financialSummary"],
    queryFn: fetchFinancialSummary,
  });

  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [remaining, setRemaining] = useState("");
  const [payStatus, setPayStatus] = useState("paid");
  const [payMethod, setPayMethod] = useState("cash");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تسجيل الدفعة");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allPayments"] });
      qc.invalidateQueries({ queryKey: ["financialSummary"] });
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      setAddOpen(false);
      setClientId(""); setAmount(""); setRemaining("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allPayments"] });
      qc.invalidateQueries({ queryKey: ["financialSummary"] });
      toast({ title: "تم الحذف بنجاح" });
      setDeleteInfo(null);
    }
  });

  const filtered = statusFilter === "all" ? payments : payments?.filter((p: any) => {
    const actualStatus = (p.amountRemaining && p.amountRemaining > 0 && p.status === "paid") ? "partial" : p.status;
    return actualStatus === statusFilter;
  });

  const stats = [
    { label: "إجمالي الإيرادات", value: financial?.totalRevenue, icon: DollarSign },
    { label: "إيرادات الشهر", value: financial?.monthlyRevenue, icon: TrendingUp },
    { label: "دفعات معلقة", value: financial?.unpaidAmount, icon: AlertCircle },
    { label: "المتوقع", value: financial?.expectedRevenue, icon: Target },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-energy" />
            <span>المالية</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>المدفوعات</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1.5">إدارة المدفوعات</h1>
          <p className="text-sm text-muted-foreground mt-1">تتبع الإيرادات وإدارة الديون المعلقة</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-9">
              <Plus className="w-4 h-4" />
              تسجيل دفعة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تسجيل معاملة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">المتدرب</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر متدرباً..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">المبلغ المحصل</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">المبلغ المتبقي</Label>
                  <Input type="number" value={remaining} onChange={(e) => setRemaining(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">حالة الدفع</Label>
                  <Select value={payStatus} onValueChange={setPayStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="partial">جزئي</SelectItem>
                      <SelectItem value="unpaid">غير مدفوع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">وسيلة الدفع</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vodafone-cash">فودافون كاش</SelectItem>
                      <SelectItem value="instapay">InstaPay</SelectItem>
                      <SelectItem value="cash">كاش</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => {
                if (!clientId || !amount) return toast({ title: "أكمل البيانات", variant: "destructive" });
                createMutation.mutate({
                  clientId,
                  amount: parseFloat(amount),
                  amountRemaining: remaining ? parseFloat(remaining) : undefined,
                  status: payStatus,
                  method: payMethod,
                  paidAt: new Date().toISOString().split("T")[0]
                });
              }} disabled={createMutation.isPending}>
                {createMutation.isPending ? "جاري التسجيل..." : "تأكيد تسجيل الدفعة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }, i) => {
          const accents = [
            { bg: "bg-primary/10", text: "text-primary" },
            { bg: "bg-energy/10", text: "text-energy" },
            { bg: "bg-warning/10", text: "text-warning" },
            { bg: "bg-primary/10", text: "text-primary" },
          ];
          const a = accents[i] || accents[0];
          return (
            <div key={label} className="rounded-xl bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", a.bg)}>
                <Icon className={cn("w-4.5 h-4.5", a.text)} />
              </div>
              {loadingFinancial ? <Skeleton className="h-7 w-20 mb-1" /> : (
                <div className="text-xl font-bold tracking-tight">
                  {value ? `${value.toLocaleString()}` : "0"} <span className="text-xs font-normal text-muted-foreground">ج.م</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          );
        })}
      </div>

      {!loadingFinancial && financial && (
        <div className="grid lg:grid-cols-5 gap-6 animate-fade-up delay-1">
          <div className="lg:col-span-3 rounded-xl bg-card p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">تحليل الإيرادات</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={financial.monthlyTrend.map((m: any) => ({ month: m.month, revenue: m.total }))}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 rounded-xl bg-card p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">طرق الدفع</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={financial.revenueByMethod.map((r: any) => ({ ...r, name: PAYMENT_METHODS[r.method] ?? r.method }))}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={75}
                  innerRadius={55}
                  paddingAngle={4}
                >
                  {financial.revenueByMethod.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {financial.revenueByMethod.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">{PAYMENT_METHODS[r.method] ?? r.method}</p>
                    <p className="text-xs font-medium">{r.amount.toLocaleString()} ج.م</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 animate-fade-up delay-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {["all", "paid", "partial", "unpaid"].map((s) => {
              const labels: Record<string, string> = { all: "الكل", paid: "مدفوع", partial: "جزئي", unpaid: "غير مدفوع" };
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "h-7 px-3 rounded-md text-xs transition-all",
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">لا توجد معاملات</p>
            <p className="text-xs text-muted-foreground">ابدأ بتسجيل أول دفعة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filtered?.map((p: any, i: number) => {
              const actualStatus = (p.amountRemaining && p.amountRemaining > 0 && p.status === "paid") ? "partial" : p.status;
              return (
                <div
                  key={p.id}
                  className="rounded-xl bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.06)] transition-all animate-fade-up"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-medium text-primary shrink-0">
                      {p.clientName?.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-foreground truncate">{p.clientName}</span>
                        <Badge variant={paymentStatusConfig[actualStatus]?.variant || "secondary"}>
                          {paymentStatusConfig[actualStatus]?.label || actualStatus}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{p.amount?.toLocaleString()} ج.م</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{PAYMENT_METHODS[p.method] ?? p.method}</span>
                        {p.amountRemaining && p.amountRemaining > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="text-destructive">متبقي {p.amountRemaining?.toLocaleString()} ج.م</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {safeDate(p.paidAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {(actualStatus === "partial" || actualStatus === "unpaid") && (
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setSettleInfo(p)}
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          تسديد
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteInfo({ id: p.id, clientId: p.clientId })}
                        className="w-8 h-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {settleInfo && (
        <PaymentModal
          open={settleInfo !== null}
          onOpenChange={(o) => { if (!o) setSettleInfo(null); }}
          clientId={settleInfo.clientId}
          clientName={settleInfo.clientName}
          existingPaymentId={settleInfo.id}
          existingAmount={settleInfo.amount}
          existingRemaining={settleInfo.amountRemaining}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["allPayments"] }); qc.invalidateQueries({ queryKey: ["financialSummary"] }); }}
        />
      )}

      <AlertDialog open={deleteInfo !== null} onOpenChange={(o) => !o && setDeleteInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سجل الدفعة؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم مسح هذه المعاملة نهائياً من السجلات.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteInfo && deleteMutation.mutate({ id: deleteInfo.id })}>
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
