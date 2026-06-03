"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Weight, FileText, ExternalLink, Bell, CheckCheck, X, Clock, MessageCircle, ChevronLeft } from "lucide-react";

import { OnboardingForm } from "@/components/OnboardingForm";
import { CheckinForm } from "@/components/CheckinForm";
import { WorkoutLogger } from "@/components/WorkoutLogger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Dumbbell, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientNotification {
  id: number
  title: string
  message: string | null
  isRead: boolean
  createdAt: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "الآن"
  if (diffMins < 60) return `منذ ${diffMins} د`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `منذ ${diffHours} س`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `منذ ${diffDays} ي`
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
}

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();
  const [client, setClient] = React.useState<any>(null);
  const [coachId, setCoachId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [checkinOpen, setCheckinOpen] = React.useState(false);
  const [workoutOpen, setWorkoutOpen] = React.useState(false);
  const [workouts, setWorkouts] = React.useState<any[]>([]);
  const [progress, setProgress] = React.useState<any[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<ClientNotification[]>([]);

  const loadClient = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/clients/by-token/${token}`);
      if (res.ok) {
        const data = await res.json();
        if (data.client) {
          setCoachId(data.client.coachId);
          setClient(data.client);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadNotifications = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/client-notifications?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {}
  }, [token]);

  const loadWorkouts = React.useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/workout-logs?clientId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data.workoutLogs || []);
      }
    } catch {
    }
  }, []);

  const loadProgress = React.useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/progress?clientId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress || []);
      }
    } catch {
    }
  }, []);

  React.useEffect(() => { loadClient(); }, [loadClient]);

  React.useEffect(() => {
    if (!client?.id || !coachId) return;
    loadWorkouts(client.id);
    loadProgress(client.id);
    loadNotifications();
  }, [client?.id, coachId, refreshKey, loadWorkouts, loadProgress, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markAsRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    await fetch(`/api/client-notifications/${id}?token=${token}`, { method: "PATCH" }).catch(() => {})
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    await fetch(`/api/client-notifications/mark-all-read?token=${token}`, { method: "PATCH" }).catch(() => {})
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!client) return <div className="p-6 text-center">رابط غير صالح</div>;

  if (!client.onboarded) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <OnboardingForm clientId={client.id} coachId={coachId} clientToken={client.uniqueToken} onComplete={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto animate-fade-up">
      <div className="relative overflow-visible rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-card border border-primary/20 p-8 sm:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">أهلاً بك، {client.name}</h1>
            <p className="text-lg text-muted-foreground font-medium max-w-xl">مستعد ليوم جديد من الإنجاز؟ تتبع تقدمك، سجل تمارينك، وحافظ على استمرارية رحلتك نحو الهدف.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-12 h-12 rounded-2xl bg-card/60 border border-border/40 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute left-0 mt-3 w-80 bg-card/90 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                    <h3 className="font-black text-sm">الإشعارات</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors">
                          تحديد الكل مقروء
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="w-6 h-6 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-12 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-xs font-bold text-muted-foreground/50">لا توجد إشعارات</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={cn(
                            "w-full text-start px-5 py-4 border-b border-border/20 transition-colors flex gap-3",
                            !n.isRead ? "bg-primary/5" : "hover:bg-muted/20"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                            !n.isRead ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted-foreground"
                          )}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs leading-snug", !n.isRead ? "font-black" : "font-medium text-muted-foreground")}>
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-[11px] text-muted-foreground/70 font-medium mt-1 line-clamp-2">
                                {n.message}
                              </p>
                            )}
                            <p className="text-[9px] text-muted-foreground/40 font-bold mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(n.createdAt)}
                            </p>
                          </div>
                          {!n.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/50 backdrop-blur-sm p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">بياناتك الحالية</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase">الهدف الرئيسي</p>
                <p className="text-sm font-black">{client.goal}</p>
              </div>
            </div>
            {client.weight && (
              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Weight className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase">الوزن الحالي</p>
                  <p className="text-sm font-black">{client.weight} كجم</p>
                </div>
              </div>
            )}
            {client.nextCheckInDate && (
              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase">المتابعة القادمة</p>
                  <p className="text-sm font-black">{client.nextCheckInDate}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="premium-shadow rounded-[2rem] border-border bg-card/50 backdrop-blur-sm p-6 flex flex-col justify-center gap-4 lg:col-span-2">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-2">إجراءات سريعة</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
              <DialogTrigger asChild>
                <Button className="h-16 flex-1 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-3">
                  <CalendarCheck className="w-6 h-6" />
                  متابعة دورية
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-border bg-card sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">المتابعة الدورية</DialogTitle>
                </DialogHeader>
                <CheckinForm clientId={client.id} coachId={coachId} clientToken={client.uniqueToken} onComplete={() => { setCheckinOpen(false); setRefreshKey(k => k + 1); }} />
              </DialogContent>
            </Dialog>
            <Dialog open={workoutOpen} onOpenChange={setWorkoutOpen}>
              <DialogTrigger asChild>
                <Button className="h-16 flex-1 rounded-2xl bg-card border-2 border-primary/20 text-primary font-black text-lg hover:bg-primary/5 transition-all gap-3">
                  <Dumbbell className="w-6 h-6" />
                  تسجيل تمرين
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-border bg-card sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">تسجيل حصة تدريبية</DialogTitle>
                </DialogHeader>
                <WorkoutLogger clientId={client.id} coachId={coachId} onComplete={() => { setWorkoutOpen(false); setRefreshKey(k => k + 1); }} />
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/50 backdrop-blur-sm p-6">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            أنظمة المتدرب
          </h3>
          <div className="space-y-3">
            {client.dietPlanUrl && (
              <div className="space-y-2">
                <a href={client.dietPlanUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-2xl border-2 border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-lg">نظام الأكل</p>
                      <p className="text-xs text-muted-foreground font-bold">عرض الملف PDF</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a href={`https://wa.me/2${client.phone}?text=${encodeURIComponent(`مرحباً! هذا رابط نظام التغذية الخاص بك:\n${window.location.origin}${client.dietPlanUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-card border border-emerald-500/20 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="font-black text-sm">فتح عبر واتساب</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                </a>
              </div>
            )}
            {client.workoutPlanUrl && (
              <div className="space-y-2">
                <a href={client.workoutPlanUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-2xl border-2 border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-lg">نظام التمرين</p>
                    <p className="text-xs text-muted-foreground font-bold">عرض الملف PDF</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </a>
              <a href={`https://wa.me/2${client.phone}?text=${encodeURIComponent(`مرحباً! هذا رابط نظام التمرين الخاص بك:\n${window.location.origin}${client.workoutPlanUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-card border border-blue-500/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="font-black text-sm">فتح عبر واتساب</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </a>
            </div>
            )}
            {!client.dietPlanUrl && !client.workoutPlanUrl && (
              <div className="p-12 text-center text-muted-foreground font-bold border-2 border-dashed border-border/50 rounded-2xl">
                لا توجد ملفات مرفوعة حالياً
              </div>
            )}
          </div>
        </Card>

        <Card className="premium-shadow rounded-[2rem] border-border bg-card/50 backdrop-blur-sm p-6 overflow-hidden">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
            سجل المتابعات
          </h3>
          <div className="space-y-4">
            {progress.length > 0 ? (
              progress.map((p: any, i: number) => (
                <div key={p.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-emerald-500">تمت المتابعة بنجاح</span>
                    <span className="text-[10px] font-black text-muted-foreground bg-card px-2 py-1 rounded-lg border border-border/50">
                      {p.recordedAt}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {p.weight && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">الوزن: {p.weight} كجم</span>}
                    {p.bodyFat && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">دهون: {p.bodyFat}%</span>}
                    {p.waist && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">بطن: {p.waist} سم</span>}
                    {p.chest && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">صدر: {p.chest} سم</span>}
                    {p.neck && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">رقبة: {p.neck} سم</span>}
                    {p.leg && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">رجل: {p.leg} سم</span>}
                    {p.arm && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">ذراع: {p.arm} سم</span>}
                    {p.glutes && <span className="text-[10px] font-black bg-muted/30 px-2 py-0.5 rounded-md">مؤخرة: {p.glutes} سم</span>}
                  </div>
                  {p.adherence && <p className="text-xs text-muted-foreground font-bold mb-1">الالتزام: {p.adherence}/10</p>}
                  {p.planFeedback && (
                    <div className="mb-1">
                      <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wide">رأيك في الخطة</p>
                      <p className="text-xs text-muted-foreground font-medium">{p.planFeedback}</p>
                    </div>
                  )}
                  {p.improvementsView && (
                    <div className="mb-1">
                      <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wide">ما تحسن</p>
                      <p className="text-xs text-muted-foreground font-medium">{p.improvementsView}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed mt-1">
                    {(p.frontPhoto || p.sidePhoto || p.backPhoto || p.inbodyPhoto) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[{ src: p.frontPhoto, label: "الأمام" }, { src: p.sidePhoto, label: "الجنب" }, { src: p.backPhoto, label: "الظهر" }, { src: p.inbodyPhoto, label: "InBody" }].filter(ph => ph.src).map((ph, idx) => (
                        <a key={idx} href={ph.src} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg overflow-hidden border border-border/40 bg-muted/10 hover:opacity-80 transition-all">
                          <img src={ph.src} alt={ph.label} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed mt-1">
                    {p.notes || "تم تسجيل المتابعة بنجاح بدون ملاحظات إضافية."}
                  </p>
                  </p>
                  {p.planAction && (
                    <div className={cn(
                      "mt-3 p-3 rounded-xl border",
                      p.planAction === "keep" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-blue-500/5 border-blue-500/20"
                    )}>
                      <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wide mb-1">
                        {p.planAction === "keep" ? "✅ تم تثبيت الخطة" : "🔄 تم تعديل الخطة"}
                      </p>
                      {p.coachComment && (
                        <p className="text-xs font-bold">{p.coachComment}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground font-bold border-2 border-dashed border-border/50 rounded-2xl">لم يتم تسجيل متابعات بعد</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="premium-shadow rounded-[2rem] border-border bg-card/50 backdrop-blur-sm p-6 overflow-hidden">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            آخر التمارين
          </h3>
          <div className="space-y-4">
            {workouts.length > 0 ? (
              workouts.map((w: any, i: number) => (
                <div key={w.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg">{w.exerciseName}</span>
                    <span className="text-[10px] font-black text-muted-foreground bg-card px-2 py-1 rounded-lg border border-border/50">{w.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(w.sets ? (() => { try { const p = JSON.parse(w.sets); return Array.isArray(p) ? p : null; } catch { return null; } })() : null)?.map((s: any, idx: number) => (
                      <span key={idx} className="bg-primary/5 text-primary px-2 py-1 rounded-lg border border-primary/10 text-[11px] font-black">
                        {s.reps} × {s.weight}كجم
                      </span>
                    )) ?? (
                      <span className="text-sm text-muted-foreground font-bold">{w.sets || w.reps ? `${w.sets || ""} مجموعات × ${w.reps || ""} تكرار` : "تم التسجيل"}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground font-bold border-2 border-dashed border-border/50 rounded-2xl">لم يتم تسجيل تمارين بعد</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
