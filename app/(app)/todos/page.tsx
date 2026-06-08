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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  client?: { id: number; name: string };
  clientName?: string;
  dueDate?: string;
  repeat: string;
  createdAt: any;
}

const fetchTodos = async (): Promise<Todo[]> => {
  const res = await fetch("/api/todos");
  if (!res.ok) throw new Error("فشل جلب المهام");
  const data = await res.json();
  return (data.todos || []).map((t: any) => ({
    ...t,
    clientName: t.client?.name,
    clientId: t.client?.id,
  }));
};

const fetchClients = async () => {
  const res = await fetch("/api/clients");
  if (!res.ok) throw new Error("فشل جلب العملاء");
  const data = await res.json();
  return data.clients || [];
};

export default function Todos() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [completedFilter, setCompletedFilter] = useState("false");

  const { data: todos, isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("none");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState("none");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل إضافة المهمة");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      toast({ title: "تم إضافة المهمة" });
      setAddOpen(false);
      setTitle(""); setClientId("none"); setDueDate(""); setRepeat("none");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تحديث المهمة");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف المهمة");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      toast({ title: "تم الحذف" });
    }
  });

  const filteredTodos = todos?.filter(t => {
    if (completedFilter === "all") return true;
    return String(t.completed) === completedFilter;
  });

  const pending = todos?.filter(t => !t.completed).length ?? 0;
  const done = todos?.filter(t => t.completed).length ?? 0;

  const sortedTodos = filteredTodos?.slice().sort((a, b) => {
    const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>الإنتاجية</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>المهام</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">المهام اليومية</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-muted-foreground">
              <span className="text-warning font-medium">{pending}</span> معلقة
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">
              <span className="text-success font-medium">{done}</span> منجزة
            </span>
          </div>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-9">
              <Plus className="w-4 h-4" />
              إضافة مهمة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>جدولة مهمة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">عنوان المهمة</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: متابعة أحمد اليوم" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">ارتباط بمتدرب (اختياري)</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="بدون عميل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون ارتباط</SelectItem>
                    {clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">الأولوية</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">أولوية قصوى</SelectItem>
                    <SelectItem value="medium">أولوية متوسطة</SelectItem>
                    <SelectItem value="low">أولوية منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">تاريخ الاستحقاق</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">التكرار</Label>
                <Select value={repeat} onValueChange={setRepeat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">مرة واحدة</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => {
                if (!title.trim()) return toast({ title: "أدخل عنوان المهمة", variant: "destructive" });
                const client = clients?.find((c: any) => c.id === clientId);
                createMutation.mutate({
                  title: title.trim(),
                  clientId: clientId !== "none" ? parseInt(clientId) : undefined,
                  clientName: client ? (client as any).name : undefined,
                  priority,
                  dueDate: dueDate || undefined,
                  repeat,
                  completed: false
                });
              }} disabled={createMutation.isPending}>
                {createMutation.isPending ? "جاري الحفظ..." : "تأكيد الإضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">تصفية:</span>
        <Select value={completedFilter} onValueChange={setCompletedFilter}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المهام</SelectItem>
            <SelectItem value="false">المعلقة</SelectItem>
            <SelectItem value="true">المنجزة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : sortedTodos?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">لا توجد مهام</p>
          <p className="text-xs text-muted-foreground mb-4">سجلك نظيف! ابدأ بجدولة مهام جديدة.</p>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>إضافة مهمة</Button>
        </div>
      ) : (
        <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] divide-y divide-border/50">
          {sortedTodos?.map((t, i) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30 first:rounded-t-xl last:rounded-b-xl animate-fade-up group",
                t.completed && "opacity-50"
              )}
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <button
                onClick={() => updateMutation.mutate({ id: t.id, data: { completed: !t.completed } })}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 active:scale-90",
                  t.completed
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:bg-primary/5"
                )}
              >
                {t.completed && <Check className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm font-medium text-foreground",
                  t.completed && "line-through text-muted-foreground"
                )}>{t.title}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "warning" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {t.priority === "high" ? "عالي" : t.priority === "medium" ? "متوسط" : "منخفض"}
                  </Badge>
                  {t.repeat && t.repeat !== "none" && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-600">
                      {t.repeat === "daily" ? "يومي" : t.repeat === "weekly" ? "أسبوعي" : t.repeat === "biweekly" ? "كل أسبوعين" : "شهري"}
                    </Badge>
                  )}
                  {t.clientName && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {t.clientName}
                    </span>
                  )}
                  {t.dueDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t.dueDate}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => deleteMutation.mutate(t.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
