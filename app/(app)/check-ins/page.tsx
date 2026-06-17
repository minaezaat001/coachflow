"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Clock, History, ChevronLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const fetchClients = async () => {
  const res = await fetch("/api/checkins");
  if (!res.ok) throw new Error("فشل جلب العملاء");
  const data = await res.json();
  return data.clients || [];
};

const fetchOverdueFollowups = async () => {
  const res = await fetch("/api/followups?overdue=true");
  if (!res.ok) throw new Error("فشل جلب المتابعات المتأخرة");
  const data = await res.json();
  return data.followups || [];
};

const fetchClientProgress = async (clientId: number) => {
  const res = await fetch(`/api/progress?clientId=${clientId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.progress || [];
};

function safeDate(d: string) {
  try { return format(new Date(d), "dd/MM/yyyy"); } catch { return d; }
}

export default function CheckInsDashboard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = React.useState<"all" | "overdue">("all");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-all"],
    queryFn: fetchClients,
  });

  const { data: overdueFollowups, isLoading: loadingOverdue } = useQuery({
    queryKey: ["followups-overdue"],
    queryFn: fetchOverdueFollowups,
  });

  const [historyClient, setHistoryClient] = React.useState<any>(null);
  const [historyProgress, setHistoryProgress] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [completingId, setCompletingId] = React.useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const allClients = (clients as any[]) || [];
  const activeClients = allClients.filter((c: any) => c.subscriptionEndDate && c.subscriptionEndDate >= today);
  const overdueCount = (overdueFollowups as any[])?.length || 0;

  const openHistory = async (client: any) => {
    setHistoryClient(client);
    setHistoryOpen(true);
    setHistoryLoading(true);
    const progress = await fetchClientProgress(client.id);
    setHistoryProgress(progress);
    setHistoryLoading(false);
  };

  const getLastCheckIn = (client: any) => {
    return client.lastCheckInDate ? safeDate(client.lastCheckInDate) : "—";
  };

  const getNextCheckIn = (client: any) => {
    return client.nextCheckInDate ? safeDate(client.nextCheckInDate) : "غير محدد";
  };

  const completeFollowup = async (followupId: number) => {
    setCompletingId(followupId);
    try {
      const res = await fetch(`/api/followups/${followupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("فشل إنهاء المتابعة");
      qc.invalidateQueries({ queryKey: ["followups-overdue"] });
      toast({ title: "تم إنهاء المتابعة" });
    } catch {
      toast({ title: "فشل إنهاء المتابعة", variant: "destructive" });
    }
    setCompletingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <nav className="text-sm text-muted-foreground">
          <span>الرئيسية</span>
          <span className="mx-2">●</span>
          <span className="text-foreground font-medium">المتابعات</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">المتابعات</h1>
        <p className="text-sm text-muted-foreground">{activeClients.length} عميل نشط — {allClients.length} إجمالي — {overdueCount} متابعات متأخرة</p>
      </div>

      <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("all")}
          className={cn("px-5 py-2 rounded-lg text-xs font-semibold transition-all", tab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          كل المتابعات
        </button>
        <button
          onClick={() => setTab("overdue")}
          className={cn("px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2", tab === "overdue" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          المتابعات المتأخرة
          {overdueCount > 0 && <Badge className="bg-destructive text-destructive-foreground font-bold text-[10px] px-1.5 py-0">{overdueCount}</Badge>}
        </button>
      </div>

      {tab === "all" && (
        <>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : allClients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <CalendarCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-lg font-semibold text-muted-foreground opacity-70">لا يوجد عملاء</p>
            </div>
          ) : (
            <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] divide-y divide-border/50">
              {allClients.map((client: any, i: number) => (
                <div
                  key={client.id}
                  className="flex items-center gap-4 p-4 animate-fade-up hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm shrink-0">
                    {client.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/clients/${client.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block">
                      {client.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 text-amber-500" />
                        آخر متابعة: {getLastCheckIn(client)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarCheck className="w-3 h-3 text-emerald-500" />
                        القادمة: {getNextCheckIn(client)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-lg gap-1.5 text-xs"
                      onClick={() => openHistory(client)}
                    >
                      <History className="w-3.5 h-3.5" />
                      سجل المتابعات
                    </Button>
                    <Link href={`/clients/${client.id}?tab=followups`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "overdue" && (
        <>
          {loadingOverdue ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : overdueFollowups?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
              <p className="text-lg font-semibold text-muted-foreground opacity-70">لا توجد متابعات متأخرة</p>
              <p className="text-xs text-muted-foreground/50 mt-1">جميع العملاء ملتزمون بمواعيد متابعاتهم</p>
            </div>
          ) : (
            <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] divide-y divide-border/50">
              {(overdueFollowups as any[])?.map((f: any, i: number) => (
                <div
                  key={f.id}
                  className="flex items-center gap-4 p-4 animate-fade-up hover:bg-destructive/5 transition-colors"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center font-semibold text-destructive text-sm shrink-0">
                    {f.client?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/clients/${f.client?.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block">
                      {f.client?.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                        <AlertCircle className="w-3 h-3" />
                        متأخرة منذ {safeDate(f.scheduledDate)}
                      </span>
                      {f.notes && <span className="text-xs text-muted-foreground">{f.notes}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 px-3 rounded-lg gap-1.5 text-xs shrink-0"
                    variant="outline"
                    onClick={() => completeFollowup(f.id)}
                    disabled={completingId === f.id}
                  >
                    {completingId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    تمت المتابعة
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              سجل متابعات {historyClient?.name || ""}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-3">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : historyProgress.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground opacity-70">لا توجد متابعات سابقة</p>
              </div>
            ) : (
              historyProgress.map((p: any, idx: number) => (
                <div key={p.id} className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-4 animate-fade-up border border-border" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">{safeDate(p.recordedAt)}</span>
                    {p.adherence && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold text-xs">
                        التزام {p.adherence}/10
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {p.weight && <Badge variant="secondary">الوزن: {p.weight} كجم</Badge>}
                    {p.bodyFat && <Badge variant="secondary">دهون: {p.bodyFat}%</Badge>}
                    {p.waist && <Badge variant="secondary">بطن: {p.waist} سم</Badge>}
                    {p.chest && <Badge variant="secondary">صدر: {p.chest} سم</Badge>}
                    {p.neck && <Badge variant="secondary">رقبة: {p.neck} سم</Badge>}
                    {p.leg && <Badge variant="secondary">رجل: {p.leg} سم</Badge>}
                    {p.arm && <Badge variant="secondary">ذراع: {p.arm} سم</Badge>}
                    {p.glutes && <Badge variant="secondary">مؤخرة: {p.glutes} سم</Badge>}
                  </div>
                  {(p.frontPhoto || p.sidePhoto || p.backPhoto || p.inbodyPhoto) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[{ src: p.frontPhoto, label: "الأمام" }, { src: p.sidePhoto, label: "الجنب" }, { src: p.backPhoto, label: "الظهر" }, { src: p.inbodyPhoto, label: "InBody" }].filter(ph => ph.src).map((ph, idx2) => (
                        <a key={idx2} href={ph.src} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-all">
                          <img src={ph.src} alt={ph.label} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {p.planFeedback && (
                    <div className="mt-2 border-t pt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">رأي العميل في الخطة</p>
                      <p className="text-xs font-medium">{p.planFeedback}</p>
                    </div>
                  )}
                  {p.improvementsView && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs font-semibold text-emerald-600 mb-0.5">ماذا تحسن من وجهة نظر العميل</p>
                      <p className="text-xs font-medium">{p.improvementsView}</p>
                    </div>
                  )}
                  {p.notes && (
                    <div className="mt-2 border-t pt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">ملاحظات العميل</p>
                      <p className="text-xs text-muted-foreground/70 font-medium">{p.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
