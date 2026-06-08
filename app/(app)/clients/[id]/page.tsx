"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Plus, Calendar, CreditCard, MessageSquare, FileText, Share2, Target, Scale, Ruler, History, Activity, User, Dumbbell, ClipboardList, Package, ExternalLink, ArrowRight, MessageCircle, Check, Clock, LayoutDashboard, DollarSign, CalendarCheck, Edit3, Upload, Loader2 } from "lucide-react";
import { PlanFileManager } from "@/components/PlanFileManager";
import { RenewalDialog } from "@/components/RenewalDialog";
import { OnboardingDisplay } from "@/components/OnboardingDisplay";
import { PaymentModal } from "@/components/PaymentModal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/components/NotificationProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutTracker } from "@/components/workout-tracker";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";


function statusBadge(status: string) {
  if (status === "active") return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black px-3 py-1 rounded-lg text-xs sm:text-sm">نشط</Badge>;
  if (status === "expired") return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-black px-3 py-1 rounded-lg text-xs sm:text-sm">منتهي</Badge>;
  return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black px-3 py-1 rounded-lg text-xs sm:text-sm">معلق</Badge>;
}

function paymentBadge(status: string) {
  if (status === "paid") return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black px-3 py-1 rounded-lg text-xs sm:text-sm">مدفوع</Badge>;
  if (status === "unpaid") return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-black px-3 py-1 rounded-lg text-xs sm:text-sm">غير مدفوع</Badge>;
  return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black px-3 py-1 rounded-lg text-xs sm:text-sm">جزئي</Badge>;
}

function safeDate(d: string) {
  try { return format(new Date(d), "dd-MM-yyyy"); } catch { return d; }
}

function subTypeLabel(t: string) {
  const map: Record<string, string> = { monthly: "شهري", quarterly: "3 شهور", "semi-annual": "6 شهور", annual: "سنة" };
  return map[t] ?? t;
}

function methodLabel(m: string) {
  const map: Record<string, string> = { "vodafone-cash": "فودافون كاش", instapay: "InstaPay", cash: "كاش", other: "أخرى" };
  return map[m] ?? m;
}

const fetchClient = async (id: string) => {
  const res = await fetch(`/api/clients/${id}`);
  if (!res.ok) throw new Error("فشل جلب العميل");
  const data = await res.json();
  return { ...data.client, _finance: data.finance };
};

const fetchSubscriptions = async (clientId: string) => {
  const res = await fetch(`/api/subscriptions?clientId=${clientId}`);
  if (!res.ok) throw new Error("فشل جلب الاشتراكات");
  const data = await res.json();
  return data.subscriptions || [];
};

const fetchPayments = async (clientId: string) => {
  const res = await fetch(`/api/payments?clientId=${clientId}`);
  if (!res.ok) throw new Error("فشل جلب المدفوعات");
  const data = await res.json();
  return data.payments || [];
};

const fetchPackages = async () => {
  const res = await fetch("/api/packages?all=true");
  if (!res.ok) throw new Error("فشل جلب الباقات");
  const data = await res.json();
  return data.packages || [];
};

const fetchProgress = async (clientId: string) => {
  const res = await fetch(`/api/progress?clientId=${clientId}`);
  if (!res.ok) throw new Error("فشل جلب التقدم");
  const data = await res.json();
  return data.progress || [];
};

const fetchExercises = async (clientId: string) => {
  const res = await fetch(`/api/exercises?clientId=${clientId}`);
  if (!res.ok) throw new Error("فشل جلب التمارين");
  const data = await res.json();
  return data.exercises || [];
};

const fetchWorkoutLogs = async (clientId: string) => {
  const res = await fetch(`/api/workout-logs?clientId=${clientId}`);
  if (!res.ok) throw new Error("فشل جلب سجلات التمارين");
  const data = await res.json();
  return data.workoutLogs || [];
};

const fetchFollowups = async (clientId: string) => {
  const res = await fetch(`/api/followups?clientId=${clientId}`);
  if (!res.ok) throw new Error("فشل جلب المتابعات");
  const data = await res.json();
  return data.followups || [];
};

const fetchOnboarding = async (clientId: string) => {
  const res = await fetch(`/api/onboarding?clientId=${clientId}`);
  if (!res.ok) throw new Error("فشل جلب بيانات التسجيل");
  const data = await res.json();
  return data.onboarding || [];
};

const fetchClientFiles = async (clientId: string) => {
  const res = await fetch(`/api/clientfiles?clientId=${clientId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = id as string;
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState(searchParams.get("tab") || "overview");

  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const qc = useQueryClient();
  const { toast } = useToast();
  const { refreshNotifications } = useNotifications();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId),
    enabled: !!clientId,
  });
  const { data: subscriptions } = useQuery({
    queryKey: ["subscriptions", clientId],
    queryFn: () => fetchSubscriptions(clientId),
    enabled: !!clientId,
  });
  const { data: payments } = useQuery({
    queryKey: ["payments", clientId],
    queryFn: () => fetchPayments(clientId),
    enabled: !!clientId,
  });
  const { data: progress } = useQuery({
    queryKey: ["progress", clientId],
    queryFn: () => fetchProgress(clientId),
    enabled: !!clientId,
  });
  const { data: exercises } = useQuery({
    queryKey: ["exercises", clientId],
    queryFn: () => fetchExercises(clientId),
    enabled: !!clientId,
  });
  const { data: followups } = useQuery({
    queryKey: ["followups", clientId],
    queryFn: () => fetchFollowups(clientId),
    enabled: !!clientId,
  });
  const { data: workoutLogs } = useQuery({
    queryKey: ["workoutLogs", clientId],
    queryFn: () => fetchWorkoutLogs(clientId),
    enabled: !!clientId,
  });
  const { data: onboardingData } = useQuery({
    queryKey: ["onboarding", clientId],
    queryFn: () => fetchOnboarding(clientId),
    enabled: !!clientId,
  });

  const { data: clientFiles } = useQuery({
    queryKey: ["clientFiles", clientId],
    queryFn: () => fetchClientFiles(clientId),
    enabled: !!clientId,
  });

  const { data: allPackages } = useQuery({
    queryKey: ["packages-all"],
    queryFn: fetchPackages,
  });

  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    if (client) {
      const freq = client.defaultCheckInFrequency || 7;
      setCheckInFreq(String(freq));
      let nextDate = client.nextCheckInDate || "";
      if (nextDate && nextDate < new Date().toISOString().split("T")[0]) {
        const d = new Date();
        d.setDate(d.getDate() + freq);
        nextDate = d.toISOString().split("T")[0];
        setNextCheckIn(nextDate);
        fetch(`/api/clients/${clientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nextCheckInDate: nextDate }),
        }).catch(() => {});
      } else {
        setNextCheckIn(nextDate);
      }
    }
  }, [client]);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تحديث العميل");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    }
  });

  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [renewOpen, setRenewOpen] = useState(false);
  const [subType, setSubType] = useState("monthly");
  const [subStart, setSubStart] = useState(new Date().toISOString().split("T")[0]);
  const [subEnd, setSubEnd] = useState("");
  const [subPrice, setSubPrice] = useState("");
  const [subStatus, setSubStatus] = useState("active");

  const createSubMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل إضافة الاشتراك");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions", clientId] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      toast({ title: "تم إضافة الاشتراك" });
      setSubOpen(false);
    }
  });

  const updateSubMutation = useMutation({
    mutationFn: async ({ subId, data }: { subId: string, data: any }) => {
      const res = await fetch(`/api/subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تحديث الاشتراك");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions", clientId] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      toast({ title: "تم تعديل الاشتراك" });
      setSubOpen(false);
    }
  });

  const openSubDialog = (sub: any = null) => {
    setEditingSub(sub);
    setSubType(sub?.type ?? "monthly");
    setSubStart(sub?.startDate ?? new Date().toISOString().split("T")[0]);
    setSubEnd(sub?.endDate ?? "");
    setSubPrice(sub?.price ?? "");
    setSubStatus(sub?.status ?? "active");
    setSubOpen(true);
  };

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRemaining, setPayRemaining] = useState("");
  const [payStatus, setPayStatus] = useState("paid");
  const [payMethod, setPayMethod] = useState("cash");

  const createPayMutation = useMutation({
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
      qc.invalidateQueries({ queryKey: ["payments", clientId] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      setPayOpen(false);
    }
  });

  const [progOpen, setProgOpen] = useState(false);
  const [progWeight, setProgWeight] = useState("");
  const [progBodyFat, setProgBodyFat] = useState("");
  const [progWaist, setProgWaist] = useState("");
  const [progDate, setProgDate] = useState(new Date().toISOString().split("T")[0]);
  const [reviewDialog, setReviewDialog] = useState<number | null>(null);
  const [reviewAction, setReviewAction] = useState<string>("keep");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [checkInFreq, setCheckInFreq] = useState("7");
  const [nextCheckIn, setNextCheckIn] = useState("");
  const [checkInSaving, setCheckInSaving] = useState(false);
  const manualDateRef = useRef(false);
  const [pkgChangeOpen, setPkgChangeOpen] = useState(false);
  const [extraFileName, setExtraFileName] = useState("");
  const [extraFile, setExtraFile] = useState<File | null>(null);
  const [extraUploading, setExtraUploading] = useState(false);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [selectedNewPackageId, setSelectedNewPackageId] = useState("");
  const [pkgChangeDate, setPkgChangeDate] = useState(new Date().toISOString().split("T")[0]);

  const updatePackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تحديث الباقة");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "تم تحديث الباقة بنجاح" });
      setPkgChangeOpen(false);
    }
  });

  const createProgMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تسجيل القياسات");
      return res.json();
    },
  });

  const [exOpen, setExOpen] = useState(false);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");
  const [exWeight, setExWeight] = useState("");
  const [exNotes, setExNotes] = useState("");
  const [exDate, setExDate] = useState(new Date().toISOString().split("T")[0]);

  const createExMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تسجيل التمرين");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises", clientId] });
      toast({ title: "تم تسجيل الجلسة بنجاح" });
      setExOpen(false);
    }
  });

  const [fuOpen, setFuOpen] = useState(false);
  const [fuType, setFuType] = useState("daily");
  const [fuDate, setFuDate] = useState(new Date().toISOString().split("T")[0]);
  const [fuNotes, setFuNotes] = useState("");

  const createFuMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل جدولة المتابعة");
      return res.json();
    },
  });

  const updateFuMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/followups/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, completedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("فشل تحديث المتابعة");
      return res.json();
    },
    onSuccess: async () => {
      const freq = parseInt(checkInFreq) || 7;
      const d = new Date();
      d.setDate(d.getDate() + freq);
      const nextDate = d.toISOString().split("T")[0];
      setNextCheckIn(nextDate);
      await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextCheckInDate: nextDate }),
      });
      qc.invalidateQueries({ queryKey: ["followups", clientId] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      toast({ title: "تم تحديد المتابعة كمنجز" });
    }
  });

  const handleExtraUpload = async () => {
    if (!extraFile || !extraFileName.trim()) {
      toast({ title: "اختر ملفاً وأدخل اسم الملف", variant: "destructive" });
      return;
    }
    if (extraFile.size > 25 * 1024 * 1024) {
      toast({ title: "حجم الملف يجب أن لا يتجاوز 25 ميجابايت", variant: "destructive" });
      return;
    }
    setExtraUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", extraFile);
      fd.append("clientId", clientId);
      fd.append("field", "extra");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) { const err = await uploadRes.json(); throw new Error(err.error || "فشل رفع الملف"); }
      const { url } = await uploadRes.json();
      await fetch("/api/clientfiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: parseInt(clientId), url, name: extraFileName.trim(), type: "other" }),
      });
      toast({ title: "تم رفع الملف الإضافي" });
      setExtraFileName(""); setExtraFile(null);
      if (extraFileRef.current) extraFileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["clientFiles", clientId] });
    } catch (err: any) {
      toast({ title: err.message || "حدث خطأ", variant: "destructive" });
    } finally { setExtraUploading(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-[2rem]" />
        <Skeleton className="h-80 w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground font-bold">العميل غير موجود</p>
        <Link href="/clients"><Button variant="outline" className="mt-4 rounded-xl">العودة للعملاء</Button></Link>
      </div>
    );
  }

  const progressData = (progress as any[])?.map((p: any) => ({ date: p.recordedAt, weight: p.weight })) ?? [];

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center gap-3">
        <Link href="/clients">
          <Button variant="ghost" size="sm" className="h-9 gap-2 font-bold text-muted-foreground hover:text-primary transition-colors text-xs">
            <ArrowRight className="w-3.5 h-3.5" />
            العودة للقائمة
          </Button>
        </Link>
      </div>

      <Card className="premium-shadow border-border overflow-hidden rounded-[2rem] bg-card/40 backdrop-blur-md">
        <div className="h-32 bg-gradient-to-r from-primary/15 via-primary/5 to-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        </div>
        <CardContent className="p-6 sm:p-8 -mt-12 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-blue-600 border-4 border-card flex items-center justify-center font-black text-white text-4xl shadow-xl group hover:rotate-6 transition-transform">
                {client.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{client.name}</h1>
                  <div className="flex items-center gap-1.5">
                    {statusBadge(client.subscriptionStatus)}
                    {paymentBadge(client?.paymentStatus)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50 text-foreground font-black" dir="ltr">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {client.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-primary" />
                    الهدف: {client.goal}
                  </span>
                  {client.weight && (
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-primary" />
                      {client.weight} كجم
                    </span>
                  )}
                  {client.height && (
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-primary" />
                      {client.height} سم
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
              <a href={`https://wa.me/2${client.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 lg:flex-none">
                <Button variant="outline" className="w-full lg:w-auto h-11 gap-2 text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white rounded-xl font-black text-xs sm:text-sm transition-all">
                  <MessageCircle className="w-5 h-5" />
                  واتساب
                </Button>
              </a>
              {client.subscriptionStatus === "expired" && (
                <Button 
                  size="lg"
                  className="flex-1 lg:flex-none h-11 gap-2 bg-primary text-primary-foreground rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  onClick={() => setRenewOpen(true)}
                >
                  <RefreshCcw className="w-5 h-5" />
                  تجديد
                </Button>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-foreground">رابط تسجيل البيانات</h3>
              </div>
              <div className="flex items-center gap-2 p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/40 group transition-all hover:bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-primary truncate opacity-85">{origin}/client/{client.uniqueToken}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-card border border-border/50 hover:bg-primary hover:text-white transition-all shadow-sm" onClick={() => {
                    const link = `${origin}/client/${client.uniqueToken}`;
                    navigator.clipboard.writeText(link);
                    toast({ title: "تم نسخ الرابط بنجاح" });
                  }}>
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-card border border-border/50 hover:bg-primary hover:text-white transition-all shadow-sm" onClick={() => {
                    window.open(`${origin}/client/${client.uniqueToken}`, '_blank');
                  }}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-up stagger-1">
        <TabsList className="flex flex-wrap flex-row-reverse h-auto gap-1.5 bg-muted/10 p-1.5 border border-border/40 w-full justify-end rounded-2xl mb-8 backdrop-blur-md">
          {[
            { id: "overview", label: "الرئيسية", icon: LayoutDashboard },
            { id: "subscriptions", label: "الاشتراكات", icon: History },
            { id: "payments", label: "المالية", icon: DollarSign },
            { id: "progress", label: "النتائج", icon: Activity },
            { id: "exercises", label: "التمارين", icon: Dumbbell },
            { id: "followups", label: "المتابعات", icon: CalendarCheck },
            { id: "onboarding", label: "البيانات", icon: ClipboardList },
            { id: "plans", label: "الأنظمة", icon: Package },
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="flex-1 min-w-[95px] sm:flex-none rounded-xl px-4 py-3 gap-2 font-black text-xs sm:text-sm md:text-base text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10 transition-all hover:bg-muted/20"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-2">
          {progressData.length > 0 && (
            <Card className="premium-shadow rounded-3xl border-border bg-card/40 backdrop-blur-md overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-2.5 border-b border-border/40 bg-muted/10 py-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <CardTitle className="text-base font-black tracking-tight">رسم بياني لتطور الوزن</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={progressData}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px' }}
                      labelStyle={{ fontWeight: 800, marginBottom: '2px' }}
                      formatter={(v) => [`${v} كجم`, "الوزن"]} 
                    />
                    <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {(() => {
            const sorted = [...((progress as any[]) || [])].filter((p: any) => p.weight != null).sort((a: any, b: any) => a.recordedAt?.localeCompare(b.recordedAt));
            const firstW = sorted.length > 0 ? sorted[0].weight : client?.weight;
            const lastW = sorted.length > 0 ? sorted[sorted.length - 1].weight : client?.weight;
            const currentWeight = lastW;
            const weightDiff = firstW != null && lastW != null ? +(firstW - lastW).toFixed(1) : 0;
            const commitmentScore = client?.commitmentScore;
            return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="premium-shadow p-5 rounded-3xl bg-card/40 border border-border/40 backdrop-blur-sm group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">الوزن الحالي والتقدم</p>
              </div>
              <div className="text-3xl font-black mb-1">
                {currentWeight != null ? `${currentWeight}` : "—"} <span className="text-base font-bold text-muted-foreground">كجم</span>
              </div>
              <div className={cn("text-xs font-bold flex items-center gap-1", weightDiff > 0 ? "text-emerald-500" : weightDiff < 0 ? "text-red-500" : "text-muted-foreground")}>
                {weightDiff > 0 ? <>⬇️ خسرت <span className="font-black">{weightDiff}</span> كجم</> : weightDiff < 0 ? <>⬆️ زادت <span className="font-black">{Math.abs(weightDiff)}</span> كجم</> : "لم يسجل تغيير بعد"}
              </div>
            </div>
            <div className="premium-shadow p-5 rounded-3xl bg-card/40 border border-border/40 backdrop-blur-sm group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">نسبة الالتزام</p>
              </div>
              <div className={cn("text-3xl font-black mb-1", commitmentScore >= 70 ? "text-emerald-500" : commitmentScore >= 50 ? "text-amber-500" : commitmentScore != null ? "text-red-500" : "")}>
                {commitmentScore != null ? `${commitmentScore}%` : "غير متاح"}
              </div>
              <div className="text-xs font-bold text-muted-foreground">
                {commitmentScore >= 80 ? "ممتاز" : commitmentScore >= 60 ? "ملتزم" : commitmentScore >= 40 ? "متوسط" : commitmentScore != null ? "يحتاج تحسين" : ""}
              </div>
            </div>
            <div className="premium-shadow p-5 rounded-3xl bg-card/40 border border-border/40 backdrop-blur-sm group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">المتابعة القادمة</p>
              </div>
              <div className="text-lg font-black mb-1 leading-relaxed">
                {(nextCheckIn || client?.nextCheckInDate) ? format(new Date(nextCheckIn || client?.nextCheckInDate), "EEEE، d MMMM yyyy", { locale: arEG }) : "لم تحدد بعد"}
              </div>
              <div className="text-xs font-bold text-muted-foreground">
                {client?.nextCheckInDate ? `كل ${client?.defaultCheckInFrequency || 7} أيام` : "جدولة متابعة جديدة"}
              </div>
            </div>
          </div>
          );})()}
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-2 space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Dialog open={pkgChangeOpen} onOpenChange={setPkgChangeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-10 px-4 rounded-lg gap-2 font-black bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all text-[10px] uppercase tracking-widest">
                  <RefreshCcw className="w-4 h-4" />
                  تعديل الباقة الحالية
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl p-8">
                <DialogHeader><DialogTitle className="text-xl font-black">تعديل باقة الاشتراك</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">الباقة الحالية</Label>
                    <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border/50 font-black text-sm">
                      {client?.package?.name || "بدون باقة"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">اختر الباقة الجديدة</Label>
                    <Select value={selectedNewPackageId} onValueChange={setSelectedNewPackageId}>
                      <SelectTrigger className="h-11 rounded-lg bg-muted/30"><SelectValue placeholder="اختر باقة..." /></SelectTrigger>
                      <SelectContent>
                        {(allPackages as any[])?.map((pkg: any) => (
                          <SelectItem key={pkg.id} value={String(pkg.id)} className="font-bold py-2 text-sm">
                            {pkg.name} — {pkg.durationMonths} شهور / {pkg.price} ج.م
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">تاريخ بداية الاشتراك الجديد</Label>
                    <Input type="date" className="h-11 rounded-lg bg-muted/30" value={pkgChangeDate} onChange={e => setPkgChangeDate(e.target.value)} />
                  </div>
                  <Button className="w-full h-12 rounded-lg font-black mt-2 text-sm bg-amber-500 hover:bg-amber-600 text-white" onClick={() => {
                    if (!selectedNewPackageId) return toast({ title: "اختر باقة جديدة", variant: "destructive" });
                    const pkg = (allPackages as any[])?.find((p: any) => String(p.id) === selectedNewPackageId);
                    if (!pkg) return toast({ title: "الباقة غير موجودة", variant: "destructive" });
                    const start = new Date(pkgChangeDate);
                    const end = new Date(start);
                    end.setMonth(end.getMonth() + pkg.durationMonths);
                    updatePackageMutation.mutate({
                      packageId: parseInt(selectedNewPackageId),
                      subscriptionStartDate: pkgChangeDate,
                    });
                  }} disabled={updatePackageMutation.isPending}>
                    {updatePackageMutation.isPending ? "جاري التحديث..." : "تأكيد التغيير"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={subOpen} onOpenChange={setSubOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-10 px-4 rounded-lg gap-2 font-black bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4" />
                  إضافة اشتراك
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl p-8">
                <DialogHeader><DialogTitle className="text-xl font-black">إدارة الاشتراك</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">نوع الاشتراك</Label>
                    <Select value={subType} onValueChange={setSubType}>
                      <SelectTrigger className="h-11 rounded-lg bg-muted/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">شهري</SelectItem>
                        <SelectItem value="quarterly">3 شهور</SelectItem>
                        <SelectItem value="semi-annual">6 شهور</SelectItem>
                        <SelectItem value="annual">سنة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">البداية</Label>
                      <Input type="date" className="h-11 rounded-lg bg-muted/30" value={subStart} onChange={e => setSubStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">النهاية</Label>
                      <Input type="date" className="h-11 rounded-lg bg-muted/30" value={subEnd} onChange={e => setSubEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">السعر (ج.م)</Label>
                    <Input type="number" className="h-11 rounded-lg bg-muted/30" value={subPrice} onChange={e => setSubPrice(e.target.value)} placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">الحالة</Label>
                    <Select value={subStatus} onValueChange={setSubStatus}>
                      <SelectTrigger className="h-11 rounded-lg bg-muted/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="expired">منتهي</SelectItem>
                        <SelectItem value="pending">معلق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-12 rounded-lg font-black mt-2 text-sm" onClick={() => {
                    if (!subEnd) return toast({ title: "حدد تاريخ النهاية", variant: "destructive" });
                    const data = { clientId, type: subType, startDate: subStart, endDate: subEnd, price: subPrice ? Math.round(parseFloat(subPrice)) : undefined, status: subStatus };
                    if (editingSub) {
                      updateSubMutation.mutate({ subId: editingSub.id, data });
                    } else {
                      createSubMutation.mutate(data);
                    }
                  }} disabled={createSubMutation.isPending || updateSubMutation.isPending}>
                    {createSubMutation.isPending || updateSubMutation.isPending ? "جاري..." : "حفظ البيانات"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {(subscriptions as any[])?.length === 0 ? (
            <div className="text-center py-16 bg-muted/10 rounded-3xl border border-dashed border-border/50">
              <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-black text-muted-foreground opacity-70">لا توجد اشتراكات سابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(subscriptions as any[])?.map((s: any) => (
                <Card key={s.id} className="cursor-pointer hover:bg-card/80 hover:scale-[1.01] transition-all group rounded-2xl border-border/50 premium-shadow bg-card/40 backdrop-blur-sm" onClick={() => openSubDialog(s)}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-base text-foreground group-hover:text-primary transition-colors tracking-tight">
                          {client?.package?.name || subTypeLabel(s.type)}
                        </div>
                        <div className="text-xs text-muted-foreground font-black opacity-70 mt-0.5">{safeDate(s.startDate)} — {safeDate(s.endDate)}</div>
                        {s.price && <div className="text-sm font-black text-primary mt-1.5">{s.price} ج.م</div>}
                      </div>
                    </div>
                    {statusBadge(s.status)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-2 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="h-10 px-4 rounded-lg gap-2 font-black bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-[10px] uppercase tracking-widest" onClick={() => setPayOpen(true)}>
              <Plus className="w-4 h-4" />
              تسجيل دفعة
            </Button>
          </div>
          <PaymentModal
            open={payOpen}
            onOpenChange={setPayOpen}
            clientId={parseInt(clientId)}
            clientName={client?.name || ""}
            onSuccess={() => { qc.invalidateQueries({ queryKey: ["payments", clientId] }); qc.invalidateQueries({ queryKey: ["client", clientId] }); }}
          />
          <div className="premium-shadow rounded-[2rem] border border-border bg-card/40 backdrop-blur-md p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">الاشتراك</p>
                <p className="text-2xl font-black text-foreground tracking-tight">{client._finance?.subscriptionValue?.toLocaleString() ?? 0} ج.م</p>
              </div>
              <div className="text-center border-x border-border/30">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">المدفوع</p>
                <p className="text-2xl font-black text-emerald-500 tracking-tight">{client._finance?.totalPaid?.toLocaleString() ?? 0} ج.م</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">المتبقي</p>
                <p className={cn("text-2xl font-black tracking-tight", client._finance?.remainingBalance > 0 ? "text-red-500" : "text-muted-foreground")}>{client._finance?.remainingBalance?.toLocaleString() ?? 0} ج.م</p>
              </div>
            </div>
          </div>
          {(payments as any[])?.length === 0 ? (
            <div className="text-center py-16 bg-muted/10 rounded-3xl border border-dashed border-border/50">
              <CreditCard className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-black text-muted-foreground opacity-70">لا توجد عمليات مالية</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(payments as any[])?.map((p: any) => (
                <Card key={p.id} className="rounded-2xl border-border/50 premium-shadow bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-black text-lg text-foreground tracking-tight">{p.amount} ج.م</div>
                        <div className="text-xs text-muted-foreground font-black opacity-70 mt-1">{methodLabel(p.method)} — {p.paidAt ? safeDate(p.paidAt) : "لم يُدفع"}</div>
                        {p.amountRemaining && p.amountRemaining > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] sm:text-xs font-black mt-2 border border-destructive/20 shadow-sm">
                            متبقي: {p.amountRemaining} ج.م
                          </div>
                        )}
                      </div>
                    </div>
                    {paymentBadge((p.amountRemaining && p.amountRemaining > 0 && p.status === "paid") ? "partial" : p.status)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-2 space-y-6">
          <div className="flex justify-end">
            <Dialog open={progOpen} onOpenChange={setProgOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-10 px-4 rounded-lg gap-2 font-black bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4" />
                  تسجيل قياسات
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl p-8 max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-xl font-black">سجل قياسات المتدرب</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">التاريخ</Label>
                    <Input type="date" className="h-11 rounded-lg bg-muted/30" value={progDate} onChange={e => setProgDate(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">الوزن (كجم)</Label>
                      <Input type="number" className="h-11 rounded-lg bg-muted/30" value={progWeight} onChange={e => setProgWeight(e.target.value)} placeholder="80" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">دهون %</Label>
                      <Input type="number" className="h-11 rounded-lg bg-muted/30" value={progBodyFat} onChange={e => setProgBodyFat(e.target.value)} placeholder="25" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">الخصر (سم)</Label>
                    <Input type="number" className="h-11 rounded-lg bg-muted/30" value={progWaist} onChange={e => setProgWaist(e.target.value)} placeholder="85" />
                  </div>
                  <Button className="w-full h-12 rounded-lg font-black mt-2 bg-emerald-600 hover:bg-emerald-700 text-sm" onClick={async () => {
                    try {
                      await createProgMutation.mutateAsync({ clientId, data: { recordedAt: progDate, weight: progWeight ? parseFloat(progWeight) : undefined, bodyFat: progBodyFat ? parseFloat(progBodyFat) : undefined, waist: progWaist ? parseFloat(progWaist) : undefined } });
                      qc.invalidateQueries({ queryKey: ["progress", clientId] });
                      qc.invalidateQueries({ queryKey: ["client", clientId] });
                      toast({ title: "تم حفظ القياسات بنجاح" });
                      setProgOpen(false);
                    } catch {
                      toast({ title: "فشل حفظ القياسات", variant: "destructive" });
                    }
                  }} disabled={createProgMutation.isPending}>
                    {createProgMutation.isPending ? "جاري..." : "حفظ السجل"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(progress as any[])?.map((p: any, i: number) => (
              <div 
                key={p.id}
                className="premium-shadow rounded-2xl border border-border bg-card/40 backdrop-blur-md p-4 space-y-3 hover:bg-card transition-all"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Scale className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="font-black text-base text-foreground tracking-tight">{safeDate(p.recordedAt)}</div>
                      <div className="text-xs text-muted-foreground font-black opacity-70 mt-0.5">سجل القياس البدني</div>
                    </div>
                  </div>
                  {p.adherence && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-xs font-black text-amber-500">الالتزام {p.adherence}/10</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {[
                    { val: p.weight, unit: "كجم", color: "text-foreground" },
                    { val: p.bodyFat, unit: "دهون %", color: "text-blue-500" },
                    { val: p.waist, unit: "بطن سم", color: "text-amber-500" },
                    { val: p.chest, unit: "صدر سم", color: "text-red-500" },
                    { val: p.neck, unit: "رقبة سم", color: "text-purple-500" },
                    { val: p.leg, unit: "رجل سم", color: "text-emerald-500" },
                    { val: p.arm, unit: "ذراع سم", color: "text-orange-500" },
                    { val: p.glutes, unit: "مؤخرة سم", color: "text-pink-500" },
                  ].filter(stat => stat.val).map((stat, idx) => (
                    <div key={idx} className="px-4 py-2 rounded-xl bg-muted/20 border border-border/40 text-center min-w-[80px]">
                      <div className={cn("text-base font-black", stat.color)}>{stat.val}</div>
                      <div className="text-xs font-black text-muted-foreground opacity-60">{stat.unit}</div>
                    </div>
                  ))}
                </div>

                {(p.frontPhoto || p.sidePhoto || p.backPhoto || p.inbodyPhoto) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {[{ src: p.frontPhoto, label: "الأمام" }, { src: p.sidePhoto, label: "الجنب" }, { src: p.backPhoto, label: "الظهر" }, { src: p.inbodyPhoto, label: "InBody" }].filter(ph => ph.src).map((ph, idx) => (
                      <a key={idx} href={ph.src} target="_blank" rel="noopener noreferrer" className="relative group rounded-xl overflow-hidden border border-border/40 bg-muted/10">
                        <img src={ph.src} alt={ph.label} className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <span className="text-[9px] text-white font-black opacity-0 group-hover:opacity-100 transition-all">{ph.label}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {p.planFeedback && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider mb-1">رأي العميل في الخطة</p>
                    <p className="text-sm font-medium text-muted-foreground">{p.planFeedback}</p>
                  </div>
                )}
                {p.improvementsView && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider mb-1">ما تحسن من وجهة نظر العميل</p>
                    <p className="text-sm font-medium text-muted-foreground">{p.improvementsView}</p>
                  </div>
                )}
                {p.notes && (
                  <p className="text-sm text-muted-foreground/70 font-medium leading-relaxed border-t border-border/20 pt-3">{p.notes}</p>
                )}

                {p.planAction ? (
                  <div className={cn(
                    "p-3 rounded-xl border",
                    p.planAction === "keep" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-blue-500/5 border-blue-500/20"
                  )}>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wide mb-1">
                      {p.planAction === "keep" ? "✅ تم تثبيت الخطة" : "🔄 تم تعديل الخطة"}
                    </p>
                    {p.coachComment && <p className="text-sm font-bold">{p.coachComment}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 flex-1 rounded-xl font-black text-xs gap-1.5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                      onClick={() => { setReviewAction("keep"); setReviewComment(""); setReviewDialog(p.id) }}
                    >
                      <Check className="w-4 h-4" />
                      تثبيت الخطة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 flex-1 rounded-xl font-black text-xs gap-1.5 border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white"
                      onClick={() => { setReviewAction("modify"); setReviewComment(""); setReviewDialog(p.id) }}
                    >
                      <Edit3 className="w-4 h-4" />
                      تعديل الخطة
                    </Button>
                    <Dialog open={reviewDialog === p.id} onOpenChange={(o) => setReviewDialog(o ? p.id : null)}>
                      <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-black">{reviewAction === "keep" ? "تثبيت الخطة الحالية" : "تعديل الخطة"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <p className="text-sm text-muted-foreground font-medium">
                            {reviewAction === "keep"
                              ? "سيتم إرسال تعليقك للعميل مع تحديث تاريخ المتابعة القادمة تلقائياً."
                              : "سيتم إعلام العميل بتعديل الخطة مع تعليقك التشجيعي."}
                          </p>
                          <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">تعليق المدرب</Label>
                            <Textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder={reviewAction === "keep" ? "أحسنت! استمر بنفس القوة 💪" : "تم تعديل الخطة بناءً على ملاحظاتك..."}
                              rows={3}
                              className="rounded-2xl border-border/50"
                            />
                          </div>
                          <Button
                            className="w-full h-12 rounded-xl font-black"
                            disabled={reviewSubmitting}
                            onClick={async () => {
                              setReviewSubmitting(true)
                              try {
                                await fetch(`/api/progress/${p.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ planAction: reviewAction, coachComment: reviewComment || null }),
                                })
                                toast({ title: reviewAction === "keep" ? "تم تثبيت الخطة" : "تم تعديل الخطة" })
                                setReviewDialog(null)
                                setReviewComment("")
                                qc.invalidateQueries({ queryKey: ["progress", clientId] })
                                qc.invalidateQueries({ queryKey: ["client", clientId] })
                              } catch {
                                toast({ title: "حدث خطأ", variant: "destructive" })
                              } finally {
                                setReviewSubmitting(false)
                              }
                            }}
                          >
                            {reviewSubmitting ? "جاري..." : reviewAction === "keep" ? "تثبيت الخطة" : "تعديل الخطة"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exercises" className="mt-2 space-y-4">
          <div className="flex justify-end">
            <Dialog open={exOpen} onOpenChange={setExOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-10 px-4 rounded-lg gap-2 font-black bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4" />
                  تسجيل أداء
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl p-8">
                <DialogHeader><DialogTitle className="text-xl font-black">سجل الأداء الحركي</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">اسم التمرين</Label>
                    <Input value={exName} className="h-11 rounded-lg bg-muted/30" onChange={e => setExName(e.target.value)} placeholder="مثلاً: Bench Press" list="exercise-suggestions" />
                    <datalist id="exercise-suggestions">
                      {Array.from(new Set((exercises as any[])?.map((e: any) => e.exerciseName) ?? [])).map((n: any) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">التاريخ</Label>
                    <Input type="date" className="h-11 rounded-lg bg-muted/30" value={exDate} onChange={e => setExDate(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">Sets</Label>
                      <Input type="number" className="h-11 rounded-lg bg-muted/30" value={exSets} onChange={e => setExSets(e.target.value)} placeholder="4" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">Reps</Label>
                      <Input type="number" className="h-11 rounded-lg bg-muted/30" value={exReps} onChange={e => setExReps(e.target.value)} placeholder="10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">الوزن</Label>
                      <Input type="number" className="h-11 rounded-lg bg-muted/30" value={exWeight} onChange={e => setExWeight(e.target.value)} placeholder="80" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">ملاحظات الأداء</Label>
                    <Input value={exNotes} className="h-11 rounded-lg bg-muted/30" onChange={e => setExNotes(e.target.value)} placeholder="ملاحظات الجلسة..." />
                  </div>
                  <Button className="w-full h-12 rounded-lg font-black mt-2 text-sm" onClick={() => {
                    if (!exName) return toast({ title: "أدخل اسم التمرين", variant: "destructive" });
                    createExMutation.mutate({ clientId, data: { exerciseName: exName, loggedAt: exDate, sets: exSets ? parseInt(exSets) : undefined, reps: exReps ? parseInt(exReps) : undefined, weight: exWeight ? parseFloat(exWeight) : undefined, notes: exNotes || undefined } });
                    setExOpen(false);
                    toast({ title: "تم تسجيل الجلسة بنجاح" });
                  }} disabled={createExMutation.isPending}>
                    {createExMutation.isPending ? "جاري..." : "تأكيد السجل"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <WorkoutTracker exercises={exercises as any} />
          {(workoutLogs as any[])?.length > 0 && (
            <Card className="premium-shadow rounded-3xl border-border bg-card/40 backdrop-blur-md p-6">
              <h3 className="text-base font-black mb-5 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                تسجيلات العميل
              </h3>
              <div className="space-y-3">
                {(workoutLogs as any[])?.map((w: any) => (
                  <div key={w.id} className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black">{w.exerciseName}</span>
                      <span className="text-[10px] font-black text-muted-foreground bg-card px-2 py-1 rounded-lg border border-border/50">{w.date}</span>
                    </div>
                    {w.sets && (() => {
                      try {
                        const parsed = JSON.parse(w.sets);
                        return Array.isArray(parsed) ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {parsed.map((s: any, idx: number) => (
                              <span key={idx} className="bg-primary/5 text-primary px-2 py-1 rounded-lg border border-primary/10 text-[11px] font-black">
                                {s.reps} × {s.weight}كجم
                              </span>
                            ))}
                          </div>
                        ) : null;
                      } catch { return null; }
                    })()}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="followups" className="mt-2 space-y-4">
          <div className="flex justify-end">
            <Dialog open={fuOpen} onOpenChange={setFuOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-10 px-4 rounded-lg gap-2 font-black bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4" />
                  جدولة متابعة
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl p-8">
                <DialogHeader><DialogTitle className="text-xl font-black">جدولة مهمة متابعة</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">نوع المتابعة</Label>
                    <Select value={fuType} onValueChange={setFuType}>
                      <SelectTrigger className="h-11 rounded-lg bg-muted/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">يومية</SelectItem>
                        <SelectItem value="weekly">أسبوعية</SelectItem>
                        <SelectItem value="monthly">شهرية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">تاريخ الجدولة</Label>
                    <Input type="date" className="h-11 rounded-lg bg-muted/30" value={fuDate} onChange={e => setFuDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">ملاحظات للمتابعة</Label>
                    <Textarea value={fuNotes} onChange={e => setFuNotes(e.target.value)} className="rounded-xl bg-muted/30 min-h-[100px]" placeholder="مثلاً: متابعة الوزن والنظام الغذائي..." />
                  </div>
                  <Button className="w-full h-12 rounded-lg font-black mt-2 text-sm bg-amber-500 text-white hover:bg-amber-600" onClick={async () => {
                    try {
                      await createFuMutation.mutateAsync({ clientId, type: fuType, scheduledAt: fuDate, notes: fuNotes, completed: false });
                      qc.invalidateQueries({ queryKey: ["followups", clientId] });
                      qc.invalidateQueries({ queryKey: ["client", clientId] });
                      qc.invalidateQueries({ queryKey: ["todayFollowups"] });
                      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
                      refreshNotifications();
                      toast({ title: "تم جدولة المتابعة بنجاح" });
                      setFuOpen(false);
                    } catch {
                      toast({ title: "فشل جدولة المتابعة", variant: "destructive" });
                    }
                  }} disabled={createFuMutation.isPending}>
                    {createFuMutation.isPending ? "جاري الحفظ..." : "تأكيد الجدولة"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {(followups as any[])?.length === 0 ? (
            <div className="text-center py-16 bg-muted/10 rounded-3xl border border-dashed border-border/50">
              <CalendarCheck className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-black text-muted-foreground opacity-70">لا توجد متابعات مجدولة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {(followups as any[])?.map((f: any) => (
                <Card key={f.id} className={cn("rounded-2xl border-border/50 premium-shadow backdrop-blur-sm transition-all", f.completed ? "bg-muted/10 opacity-60" : "bg-card/40 hover:bg-card hover:scale-[1.01]")}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner transition-colors", f.completed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                        {f.completed ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-black text-base text-foreground tracking-tight">{f.type === "daily" ? "متابعة يومية" : "متابعة دورية"}</div>
                        <div className="text-xs text-muted-foreground font-black opacity-70 mt-0.5">{safeDate(f.scheduledAt)}</div>
                        {f.notes && <p className="text-xs font-bold text-muted-foreground mt-2 line-clamp-1">{f.notes}</p>}
                      </div>
                    </div>
                    {!f.completed && (
                      <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all" onClick={() => updateFuMutation.mutate({ id: f.id })} disabled={updateFuMutation.isPending}>تحديد كمنجز</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="premium-shadow rounded-[2rem] border-border bg-card/40 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-base font-black">تاريخ المتابعة القادمة</h3>
            </div>
            <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">المتابعة القادمة</p>
                  <p className="text-lg font-black">{nextCheckIn || client?.nextCheckInDate || "لم يتم تحديدها بعد"}</p>
                </div>
              </div>
              <div className="text-left">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">تكرار المتابعة</p>
                  <p className="text-base font-black">كل {client?.defaultCheckInFrequency || 7} أيام</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <CalendarCheck className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <h3 className="text-sm font-black tracking-tight">تعديل مواعيد وجدولة المتابعة</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">الدورية (كل X أيام)</Label>
                  <Input
                    type="number"
                    min="1"
                    className="h-11 rounded-xl bg-muted/30 border-border/50"
                    value={checkInFreq}
                    onChange={(e) => {
                      setCheckInFreq(e.target.value);
                      if (!manualDateRef.current && e.target.value) {
                        const days = parseInt(e.target.value);
                        if (!isNaN(days) && days > 0) {
                          const d = new Date();
                          d.setDate(d.getDate() + days);
                          setNextCheckIn(d.toISOString().split("T")[0]);
                        }
                      }
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground font-medium">
                    التكرار الحالي: كل {client.defaultCheckInFrequency || 7} أيام
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest opacity-70">تحديث تاريخ المتابعة يدوياً</Label>
                  <Input
                    type="date"
                    className="h-11 rounded-xl bg-muted/30 border-border/50"
                    value={nextCheckIn}
                    onChange={(e) => {
                      manualDateRef.current = true;
                      setNextCheckIn(e.target.value);
                    }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="h-10 px-6 rounded-xl font-black gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                disabled={checkInSaving}
                onClick={async () => {
                  setCheckInSaving(true)
                  try {
                    await fetch(`/api/clients/${clientId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        defaultCheckInFrequency: parseInt(checkInFreq),
                        nextCheckInDate: nextCheckIn || new Date(Date.now() + parseInt(checkInFreq) * 86400000).toISOString().split("T")[0],
                      }),
                    })
                    manualDateRef.current = false
                    toast({ title: "تم حفظ إعدادات المتابعة" })
                    qc.invalidateQueries({ queryKey: ["client", clientId] })
                  } catch {
                    toast({ title: "حدث خطأ", variant: "destructive" })
                  } finally {
                    setCheckInSaving(false)
                  }
                }}
              >
                {checkInSaving ? "جاري..." : "حفظ الإعدادات"}
              </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-2">
          {onboardingData && (onboardingData as any).length > 0 ? (
            <OnboardingDisplay data={((onboardingData as any)[0] as any).data} />
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-[2rem] border border-dashed border-border/50">
              <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm sm:text-base font-black text-muted-foreground opacity-70">لم يتم استلام بيانات التسجيل بعد</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans" className="mt-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-energy" />
                <h3 className="text-sm font-semibold">نظام التغذية</h3>
              </div>
              <PlanFileManager
                clientId={parseInt(clientId)}
                clientPhone={client.phone}
                field="dietPlanUrl"
                currentUrl={client.dietPlanUrl}
                title="نظام التغذية"
                icon={<FileText className="w-4 h-4" />}
                accent="energy"
                onUpdate={() => { qc.invalidateQueries({ queryKey: ["client", clientId] }); qc.invalidateQueries({ queryKey: ["clientFiles", clientId] }); }}
              />
            </div>
            <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold">نظام التمرين</h3>
              </div>
              <PlanFileManager
                clientId={parseInt(clientId)}
                clientPhone={client.phone}
                field="workoutPlanUrl"
                currentUrl={client.workoutPlanUrl}
                title="نظام التمرين"
                icon={<Dumbbell className="w-4 h-4" />}
                accent="primary"
                onUpdate={() => { qc.invalidateQueries({ queryKey: ["client", clientId] }); qc.invalidateQueries({ queryKey: ["clientFiles", clientId] }); }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-purple-500" />
              <h3 className="text-sm font-semibold">ملفات إضافية</h3>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground">اسم الملف</Label>
                <Input
                  value={extraFileName}
                  onChange={(e) => setExtraFileName(e.target.value)}
                  placeholder="مثال: شهادة طبية"
                  className="h-10 rounded-xl bg-muted/20 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground opacity-0">رفع</Label>
                <input ref={extraFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setExtraFile(f); }} />
                <Button variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => extraFileRef.current?.click()}>
                  {extraFile ? extraFile.name.slice(0, 20) : "اختيار ملف"}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground opacity-0">رفع</Label>
                <Button size="sm" className="h-10 rounded-xl gap-1.5" onClick={handleExtraUpload} disabled={extraUploading || !extraFile}>
                  {extraUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  رفع
                </Button>
              </div>
            </div>
            {(clientFiles as any[])?.filter((f: any) => f.type === "other").length > 0 && (
              <div className="space-y-2 pt-2">
                {(clientFiles as any[])?.filter((f: any) => f.type === "other").map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/30">
                    <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground">{safeDate(f.createdAt)}</p>
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="w-7 h-7">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-semibold">سجل التعديلات</h3>
            </div>
            {(clientFiles as any[])?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">لا توجد تعديلات سابقة</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(clientFiles as any[])?.slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/30">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      f.type === "diet" ? "bg-energy/10" : f.type === "workout" ? "bg-primary/10" : "bg-purple-500/10"
                    )}>
                      <FileText className={cn("w-4 h-4", f.type === "diet" ? "text-energy" : f.type === "workout" ? "text-primary" : "text-purple-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground">{safeDate(f.createdAt)}</p>
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="w-7 h-7" title="عرض">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <RenewalDialog 
        open={renewOpen} 
        onOpenChange={setRenewOpen} 
        client={{ id: clientId, name: client.name, subscriptionEndDate: client.subscriptionEndDate }} 
      />
    </div>
  );
}
