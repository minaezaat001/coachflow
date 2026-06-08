"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Trash2, Check, Clock, MessageCircle, Calendar, ArrowRight, User, AlertCircle, CheckCircle2, Filter, Sparkles, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

function safeDate(d: string) {
  try { return format(new Date(d), "dd MMMM yyyy", { locale: arEG }); } catch { return d; }
}

const fetchAllFollowups = async () => {
  const res = await fetch("/api/followups");
  if (!res.ok) throw new Error("فشل جلب المتابعات");
  const data = await res.json();
  return (data.followups || []).map((f: any) => ({
    ...f,
    clientName: f.client?.name,
    clientPhone: f.client?.phone,
    clientId: f.client?.id,
  }));
};

const fetchClients = async () => {
  const res = await fetch("/api/clients");
  if (!res.ok) throw new Error("فشل جلب العملاء");
  const data = await res.json();
  return data.clients || [];
};

export default function Followups() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ id: string, clientId: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [completedFilter, setCompletedFilter] = useState("all");

  const { data: followups, isLoading } = useQuery({
    queryKey: ["allFollowups"],
    queryFn: fetchAllFollowups,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const [clientId, setClientId] = useState("");
  const [fuTitle, setFuTitle] = useState("");
  const [fuType, setFuType] = useState("daily");
  const [fuPriority, setFuPriority] = useState("medium");
  const [fuDate, setFuDate] = useState(new Date().toISOString().split("T")[0]);
  const [fuNotes, setFuNotes] = useState("");
  const [editInfo, setEditInfo] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل إضافة المتابعة");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allFollowups"] });
      toast({ title: "✅ تم إضافة المتابعة بنجاح" });
      setAddOpen(false);
      setClientId(""); setFuTitle(""); setFuNotes("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await fetch(`/api/followups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تحديث المتابعة");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allFollowups"] });
      toast({ title: "تم تحديث المتابعة" });
      setEditInfo(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/followups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allFollowups"] });
      toast({ title: "تم الحذف بنجاح" });
      setDeleteInfo(null);
    }
  });

  const filteredFollowups = followups?.filter((f: any) => {
    const typeMatch = typeFilter === "all" || f.type === typeFilter;
    const completedMatch = completedFilter === "all" || String(f.completed) === completedFilter;
    return typeMatch && completedMatch;
  });

  const pendingCount = followups?.filter((f: any) => !f.completed).length ?? 0;
  const completedCount = followups?.filter((f: any) => f.completed).length ?? 0;

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>الرئيسية</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>المتابعات</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">المتابعات</h1>
        <p className="text-sm text-muted-foreground mt-1">تتبع أداء المتدربين، جدول المراجعات الأسبوعية، وضمان استمرارية التقدم.</p>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-muted-foreground">معلق: {pendingCount}</span>
          <span className="text-sm text-muted-foreground">منجز: {completedCount}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-36">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="daily">يومية</SelectItem>
              <SelectItem value="weekly">أسبوعية</SelectItem>
            </SelectContent>
          </Select>
          <Select value={completedFilter} onValueChange={setCompletedFilter}>
            <SelectTrigger className="h-10 w-36">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المتابعات</SelectItem>
              <SelectItem value="false">المعلقة</SelectItem>
              <SelectItem value="true">المنجزة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-5 h-5 ml-2" />
              إضافة متابعة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">جدولة متابعة جديدة</DialogTitle>
              <CardDescription className="text-sm text-muted-foreground">قم بتحديد المتدرب ونوع المتابعة لضمان الالتزام.</CardDescription>
            </DialogHeader>
            <div className="space-y-5 mt-6">
              <div className="space-y-2.5">
                <Label>المتدرب</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر متدرباً" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label>عنوان المتابعة</Label>
                <Input value={fuTitle} onChange={e => setFuTitle(e.target.value)} placeholder="مثال: مراجعة أسبوعية" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label>نوع المتابعة</Label>
                  <Select value={fuType} onValueChange={setFuType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">متابعة يومية</SelectItem>
                      <SelectItem value="weekly">تقييم أسبوعي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label>الأولوية</Label>
                  <Select value={fuPriority} onValueChange={setFuPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">عاجل</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">عادي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2.5">
                <Label>التاريخ</Label>
                <Input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} />
              </div>
              <div className="space-y-2.5">
                <Label>ملاحظات التحضير</Label>
                <Textarea value={fuNotes} onChange={e => setFuNotes(e.target.value)} placeholder="مثال: مراجعة قياسات الوزن..." className="resize-none min-h-[80px]" />
              </div>
              <Button className="w-full" onClick={() => {
                if (!clientId) return toast({ title: "اختر عميلاً", variant: "destructive" });
                createMutation.mutate({ clientId, title: fuTitle || "متابعة", type: fuType, priority: fuPriority, scheduledAt: fuDate, notes: fuNotes || undefined, completed: false });
              }} disabled={createMutation.isPending}>
                {createMutation.isPending ? "جاري الإضافة..." : "تأكيد الجدولة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filteredFollowups?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-muted-foreground">لا توجد متابعات</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">استخدم زر الإضافة بالأعلى للجدولة.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50 rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          {filteredFollowups?.map((f: any, i: number) => (
            <div
              key={f.id}
              className={cn(
                "group p-4 sm:p-5 flex items-center gap-5 hover:bg-muted/30 transition-colors relative animate-fade-up",
                f.completed && "opacity-50"
              )}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className={cn(
                "absolute top-0 right-0 w-1 h-full",
                f.completed ? "bg-emerald-500" : "bg-amber-500"
              )} />

              <button
                onClick={() => updateMutation.mutate({ id: f.id, data: { completed: !f.completed, completedAt: !f.completed ? new Date().toISOString() : undefined } })}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                  f.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-muted-foreground/20 hover:border-amber-500/40 hover:bg-amber-500/5"
                )}
              >
                {f.completed ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5 text-muted-foreground" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Link href={`/clients/${f.clientId}`}>
                    <h3 className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                      {f.clientName}
                      <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn(
                      f.type === "daily" ? "border-blue-500/30 text-blue-600" : "border-purple-500/30 text-purple-600"
                    )}>
                      {f.type === "daily" ? "يومية" : "أسبوعية"}
                    </Badge>
                    <Badge variant={f.priority === "high" ? "destructive" : f.priority === "low" ? "secondary" : "warning"}>
                      {f.priority === "high" ? "عاجل" : f.priority === "low" ? "عادي" : "متوسط"}
                    </Badge>
                  </div>
                </div>

                {f.title && f.title !== "متابعة" && (
                  <p className="text-sm text-foreground/80 mb-1">{f.title}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {safeDate(f.scheduledAt)}
                  </div>
                  {f.completedAt && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      أنجز: {safeDate(f.completedAt)}
                    </div>
                  )}
                </div>

                {f.notes && (
                  <div className="mt-3 p-3 rounded-xl bg-muted/20 border">
                    <p className="text-sm text-foreground/80 leading-relaxed italic">
                      "{f.notes}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => setEditInfo(f)}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </Button>
                <a href={`https://wa.me/2${f.clientPhone}`} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
                  <Button variant="outline" size="icon">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </a>
                <Button variant="ghost" size="icon" onClick={() => setDeleteInfo({ id: f.id, clientId: f.clientId })}>
                  <Trash2 className="w-5 h-5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editInfo !== null} onOpenChange={(o) => !o && setEditInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">تعديل المتابعة</DialogTitle>
            <CardDescription className="text-sm text-muted-foreground">تحديث بيانات المتابعة.</CardDescription>
          </DialogHeader>
          <div className="space-y-5 mt-6">
            <div className="space-y-2.5">
              <Label>عنوان المتابعة</Label>
              <Input value={editInfo?.title || ""} onChange={e => setEditInfo((prev: any) => prev ? { ...prev, title: e.target.value } : null)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label>الأولوية</Label>
                <Select value={editInfo?.priority || "medium"} onValueChange={v => setEditInfo((prev: any) => prev ? { ...prev, priority: v } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عاجل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">عادي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label>التاريخ</Label>
                <Input type="date" value={editInfo?.scheduledAt || ""} onChange={e => setEditInfo((prev: any) => prev ? { ...prev, scheduledAt: e.target.value } : null)} />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label>ملاحظات</Label>
              <Textarea value={editInfo?.notes || ""} onChange={e => setEditInfo((prev: any) => prev ? { ...prev, notes: e.target.value } : null)} className="resize-none min-h-[80px]" />
            </div>
            <Button className="w-full" onClick={() => {
              if (!editInfo) return;
              updateMutation.mutate({ id: editInfo.id, data: { title: editInfo.title, priority: editInfo.priority, scheduledAt: editInfo.scheduledAt, notes: editInfo.notes } });
            }} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteInfo !== null} onOpenChange={(o) => !o && setDeleteInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">حذف السجل؟</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">سيتم حذف هذا السجل نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteInfo && deleteMutation.mutate({ id: deleteInfo.id })}>
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
