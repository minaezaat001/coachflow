"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { calculateClientStatus } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  RefreshCcw,
  CheckSquare,
  ListTodo,
  ArrowUpRight,
  Target,
  Link2,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { RenewalDialog } from "@/components/RenewalDialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-context";

const fetchSummary = async () => {
  const res = await fetch("/api/dashboard/summary");
  if (!res.ok) throw new Error("فشل جلب الملخص");
  return res.json();
};

const fetchTodayFollowups = async () => {
  const res = await fetch("/api/dashboard/today-followups");
  if (!res.ok) throw new Error("فشل جلب متابعات اليوم");
  const data = await res.json();
  return data.followups || [];
};

const fetchTodayTasks = async () => {
  const today = new Date().toISOString().split("T")[0];
  const res = await fetch(`/api/todos?date=${today}&completed=false`);
  if (!res.ok) throw new Error("فشل جلب مهام اليوم");
  const data = await res.json();
  return data.todos || [];
};

const fetchExpiringSoon = async () => {
  const res = await fetch("/api/dashboard/expiring-soon");
  if (!res.ok) throw new Error("فشل جلب الاشتراكات المنتهية");
  const data = await res.json();
  const now = new Date();
  return (data.clients || []).map((c: any) => {
    const endDate = new Date(c.subscriptionEndDate);
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      clientId: c.id,
      clientName: c.name,
      endDate: c.subscriptionEndDate,
      daysLeft: diffDays,
      status: calculateClientStatus(c),
    };
  }).sort((a: any, b: any) => a.daysLeft - b.daysLeft);
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  loading,
  sub,
  accent,
  href,
  trend,
}: {
  title: string;
  value?: string | number;
  icon: any;
  loading?: boolean;
  sub?: string;
  accent: "primary" | "energy" | "warning" | "destructive";
  href?: string;
  trend?: string;
}) => {
  const accents = {
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
    energy: { bg: "bg-energy/10", text: "text-energy", border: "border-energy/20" },
    warning: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
    destructive: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
  };

  const a = accents[accent];

  const card = (
    <div className={cn(
      "rounded-xl bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] group animate-fade-up",
      href && "cursor-pointer hover:-translate-y-0.5"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", a.bg)}>
          <Icon className={cn("w-4.5 h-4.5", a.text)} />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium", a.text)}>
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-20 mb-1" />
      ) : (
        <div className="text-2xl font-bold tracking-tight">
          {value ?? "—"}
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: fetchSummary,
  });
  const [copied, setCopied] = React.useState(false);
  const { data: followups, isLoading: loadingFollowups } = useQuery({
    queryKey: ["todayFollowups"],
    queryFn: fetchTodayFollowups,
  });
  const { data: expiring, isLoading: loadingExpiring } = useQuery({
    queryKey: ["expiringSoon"],
    queryFn: fetchExpiringSoon,
  });
  const { data: todayTasks } = useQuery({
    queryKey: ["todayTasks"],
    queryFn: fetchTodayTasks,
  });

  React.useEffect(() => {
    fetch("/api/notifications/generate", { method: "POST" }).catch(() => {});
  }, []);

  const [renewClient, setRenewClient] = useState<any>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-energy" />
              <span>{format(new Date(), "EEEE، dd MMMM yyyy", { locale: arEG })}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>نظرة عامة</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1.5">
              مرحباً بك في <span className="text-primary">CoachFlow</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {summary?.activeClients
                ? `لديك ${summary.activeClients} عميل نشط — ${summary.pendingFollowups || 0} متابعات اليوم`
                : "ابدأ يومك بمتابعة عملائك"}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/pricing/${user?.id || ""}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-primary/5 border border-primary/10 text-primary hover:bg-primary/10 transition-all text-xs font-black shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {copied ? "تم النسخ!" : "طلب اشتراك جديد"}
          </button>

        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="إجمالي العملاء" value={summary?.totalClients} icon={Users} loading={loadingSummary} accent="primary" href="/clients" />
        <StatCard title="عملاء نشطين" value={summary?.activeClients} icon={Activity} loading={loadingSummary} accent="energy" href="/clients?filter=active" trend="نشط" />
        <StatCard title="متابعات اليوم" value={summary?.pendingFollowups} icon={CalendarCheck} loading={loadingSummary} accent={summary?.pendingFollowups ? "warning" : "energy"} href="/followups" />
        <StatCard title="الإيرادات" value={summary?.totalRevenue ? `${summary.totalRevenue.toLocaleString()} ج.م` : "0"} icon={DollarSign} loading={loadingSummary} accent="primary" href="/payments" />
        <StatCard title="مبالغ متأخرة" value={summary?.unpaidAmount ? `${summary.unpaidAmount.toLocaleString()} ج.م` : "0"} icon={Target} loading={loadingSummary} accent={summary?.unpaidAmount ? "destructive" : "energy"} href="/payments" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="animate-fade-up delay-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <div>
                <h2 className="text-sm font-semibold">مهام اليوم</h2>
                {todayTasks && (
                  <p className="text-xs text-muted-foreground">{todayTasks.length} مهام معلقة</p>
                )}
              </div>
            </div>
            <Link href="/todos">
              <Button variant="ghost" size="sm">عرض الكل</Button>
            </Link>
          </div>
          <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
            {!todayTasks || todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-energy/10 flex items-center justify-center mb-3">
                  <CheckSquare className="w-6 h-6 text-energy" />
                </div>
                <p className="text-sm font-semibold text-foreground">كل شيء منجز!</p>
                <p className="text-xs text-muted-foreground mt-1">لا توجد مهام متبقية لليوم</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {todayTasks.map((t: any, i: number) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ListTodo className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.priority === "high" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">عاجل</Badge>}
                        {t.client?.name && <span className="text-xs text-muted-foreground">{t.client.name}</span>}
                      </div>
                    </div>
                    <Link href={t.client?.id ? `/clients/${t.client.id}` : "/todos"}>
                      <Button variant="ghost" size="sm">فتح</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="animate-fade-up delay-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-1 h-5 rounded-full", followups?.length > 0 ? "bg-warning" : "bg-muted-foreground/30")} />
              <div>
                <h2 className="text-sm font-semibold">متابعات اليوم</h2>
                {!loadingFollowups && followups && (
                  <p className={cn("text-xs", followups.length > 0 ? "text-warning font-medium" : "text-muted-foreground")}>
                    {followups.length} متابعات
                  </p>
                )}
              </div>
            </div>
            <Link href="/followups">
              <Button variant="ghost" size="sm">عرض الكل</Button>
            </Link>
          </div>
          <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
            {loadingFollowups ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !followups || followups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-energy/10 flex items-center justify-center mb-3">
                  <CalendarCheck className="w-6 h-6 text-energy" />
                </div>
                <p className="text-sm font-semibold text-foreground">كل المتابعات منجزة</p>
                <p className="text-xs text-muted-foreground mt-1">لقد أنجزت كل شيء لليوم!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {followups.map((f: any) => {
                  const isOverdue = f.scheduledAt < new Date().toISOString().split("T")[0];
                  return (
                    <div key={f.id} className={cn(
                      "flex items-center gap-3 px-5 py-3.5 transition-colors",
                      isOverdue ? "bg-destructive/[0.03] hover:bg-destructive/[0.06]" : "hover:bg-muted/30"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isOverdue ? "bg-destructive/10" : followups.length > 2 ? "bg-warning/10" : "bg-energy/10"
                      )}>
                        <Clock className={cn("w-4 h-4", isOverdue ? "text-destructive" : "text-warning")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm truncate", isOverdue ? "font-semibold text-destructive" : "font-medium text-foreground")}>
                            {f.client?.name || "عميل"}
                          </p>
                          <Badge variant={f.priority === "high" ? "destructive" : f.priority === "low" ? "secondary" : "warning"} className="text-[10px] px-1.5 py-0">
                            {f.priority === "high" ? "عاجل" : f.priority === "low" ? "عادي" : "متوسط"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{f.title}</p>
                        {isOverdue && (
                          <p className="text-xs text-destructive font-medium mt-0.5">متأخرة — {f.scheduledAt}</p>
                        )}
                      </div>
                      <Link href={`/clients/${f.client?.id}`}>
                        <Button variant="ghost" size="sm">فتح</Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="animate-fade-up delay-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-1 h-5 rounded-full", expiring?.length > 0 ? "bg-destructive" : "bg-muted-foreground/30")} />
            <div>
              <h2 className="text-sm font-semibold">الاشتراكات المنتهية</h2>
              {!loadingExpiring && expiring && (
                <p className={cn("text-xs", expiring.length > 0 ? "text-destructive font-medium" : "text-muted-foreground")}>
                  {expiring.length} عميل بحاجة للتجديد
                </p>
              )}
            </div>
          </div>
          <Link href="/clients">
            <Button variant="ghost" size="sm">عرض الكل</Button>
          </Link>
        </div>
        <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
          {loadingExpiring ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !expiring || expiring.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-energy/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-energy" />
              </div>
              <p className="text-sm font-semibold text-foreground">الوضع مستقر</p>
              <p className="text-xs text-muted-foreground mt-1">جميع الاشتراكات نشطة</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {expiring.map((sub: any) => {
                const isExpired = sub.status === "expired";
                const isUrgent = !isExpired && sub.daysLeft <= 3;
                return (
                  <div key={`${sub.clientId}-${sub.endDate}`} className={cn(
                    "flex items-center gap-3 px-5 py-4 transition-colors",
                    isExpired ? "bg-destructive/[0.03] hover:bg-destructive/[0.06]" :
                    isUrgent ? "bg-warning/[0.03] hover:bg-warning/[0.06]" :
                    "hover:bg-muted/30"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isExpired ? "bg-destructive/10" : isUrgent ? "bg-warning/10" : "bg-primary/10"
                    )}>
                      <Activity className={cn(
                        "w-4 h-4",
                        isExpired ? "text-destructive" : isUrgent ? "text-warning" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", isExpired ? "font-semibold text-destructive" : "font-medium text-foreground")}>
                        {sub.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(sub.endDate), "dd MMM yyyy", { locale: arEG })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isExpired ? "destructive" : isUrgent ? "warning" : "success"}>
                        {isExpired ? "منتهي" : sub.daysLeft === 0 ? "ينتهي اليوم" : `${sub.daysLeft} أيام`}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenewClient(sub);
                        }}
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {renewClient && (
        <RenewalDialog
          open={!!renewClient}
          onOpenChange={(open) => !open && setRenewClient(null)}
          client={{
            id: renewClient.clientId,
            name: renewClient.clientName,
            subscriptionEndDate: renewClient.endDate,
          }}
        />
      )}
    </div>
  );
}
