"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateClientStatus } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  MessageCircle,
  Trash2,
  ChevronLeft,
  Target,
  Weight,
  Star,
  Users,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { variant: "success" | "destructive" | "warning"; label: string }> = {
  active: { variant: "success", label: "نشط" },
  expired: { variant: "destructive", label: "منتهي" },
  pending: { variant: "warning", label: "معلق" },
};

const paymentConfig: Record<string, { variant: "default" | "destructive" | "warning"; label: string }> = {
  paid: { variant: "default", label: "مدفوع" },
  unpaid: { variant: "destructive", label: "غير مدفوع" },
  partial: { variant: "warning", label: "جزئي" },
};

const fetchClients = async () => {
  const res = await fetch("/api/clients");
  if (!res.ok) throw new Error("فشل جلب العملاء");
  const data = await res.json();
  return (data.clients || []).map((c: any) => ({
    ...c,
    subscriptionStatus: calculateClientStatus(c),
  }));
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === "active") setStatusFilter("active");
    if (filter === "expired") setStatusFilter("expired");
    if (filter === "pending") setStatusFilter("pending");
  }, [searchParams]);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "تم حذف العميل" });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: "فشل الحذف", description: error.message, variant: "destructive" });
    }
  });

  const filteredClients = clients?.filter((c: any) => {
    const nameMatch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const statusMatch = statusFilter === "all" || c.subscriptionStatus === statusFilter;
    const goalMatch = goalFilter === "all" || c.goal === goalFilter;
    return nameMatch && statusMatch && goalMatch;
  });

  const activeCount = clients?.filter((c: any) => c.subscriptionStatus === "active").length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-energy" />
            <span>الإدارة</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>العملاء</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1.5">قائمة العملاء</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "جاري التحميل..." : (
              <>{filteredClients?.length ?? 0} متدرب — <span className="text-energy font-medium">{activeCount} نشط</span></>
            )}
          </p>
        </div>
        <Link href="/clients/new">
          <Button variant="energy" className="h-9 shadow-sm shadow-energy/20">
            <Plus className="w-4 h-4" />
            إضافة عميل
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
              <SelectItem value="pending">معلق</SelectItem>
            </SelectContent>
          </Select>
          <Select value={goalFilter} onValueChange={setGoalFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="الهدف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأهداف</SelectItem>
              <SelectItem value="تخسيس">تخسيس</SelectItem>
              <SelectItem value="تضخيم">تضخيم</SelectItem>
              <SelectItem value="لياقة">لياقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredClients?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">لا يوجد عملاء بعد</p>
          <p className="text-sm text-muted-foreground mb-5">أضف أول عميل وابدأ رحلة التغيير</p>
          <Link href="/clients/new">
            <Button>
              <Plus className="w-4 h-4" />
              إضافة عميل
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] divide-y divide-border/50 overflow-hidden">
          {filteredClients?.map((client: any, i: number) => {
            const subStatus = client.subscriptionStatus;
            return (
              <div
                key={client.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30 animate-fade-up",
                  subStatus === "active" && "border-r-2 border-success/40",
                  subStatus === "expired" && "border-r-2 border-destructive/40",
                  subStatus === "pending" && "border-r-2 border-warning/40"
                )}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-semibold shrink-0",
                  subStatus === "active" ? "bg-energy/10 text-energy" :
                  subStatus === "expired" ? "bg-destructive/10 text-destructive" :
                  "bg-warning/10 text-warning"
                )}>
                  {client.name?.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/clients/${client.id}`}>
                      <span className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        {client.name}
                      </span>
                    </Link>
                    {client.tags?.includes("VIP") && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span dir="ltr">{client.phone}</span>
                    {client.goal && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {client.goal}
                        </span>
                      </>
                    )}
                    {client.weight && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          {client.weight} كجم
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig[subStatus]?.variant || "secondary"}>
                    {statusConfig[subStatus]?.label || subStatus}
                  </Badge>
                  <Badge variant={paymentConfig[client.paymentStatus]?.variant || "secondary"}>
                    {paymentConfig[client.paymentStatus]?.label || client.paymentStatus}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <a href={`https://wa.me/2${client.phone}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-energy hover:text-energy hover:bg-energy/10">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </a>
                  <Link href={`/clients/${client.id}`}>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(client.id)}
                    className="w-8 h-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العميل؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع بيانات هذا العميل نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف نهائي"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
