"use client";

import * as React from "react";
import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useTheme } from "@/components/ThemeProvider";
import {
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  Palette,
  LogOut,
  CheckCircle2,
  Edit,
  Lock,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Link2,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [themeEffects, setThemeEffects] = useState(true);
  const [subAlerts, setSubAlerts] = useState(true);
  const [payAlerts, setPayAlerts] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pricingLink, setPricingLink] = useState("");
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (user?.id) {
      setPricingLink(`${window.location.origin}/pricing/${user.id}`);
    }
  }, [user?.id]);

  React.useEffect(() => {
    const storedEffects = localStorage.getItem("themeEffects");
    if (storedEffects !== null) setThemeEffects(storedEffects === "true");
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.whatsapp) setWhatsapp(d.user.whatsapp);
      if (d.user?.notifySubExpiry !== undefined) setSubAlerts(d.user.notifySubExpiry);
      if (d.user?.notifyPayment !== undefined) setPayAlerts(d.user.notifyPayment);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    localStorage.setItem("themeEffects", String(themeEffects));
    document.documentElement.classList.toggle("disable-effects", !themeEffects);
  }, [themeEffects]);

  const saveNotifPref = async (field: string, value: boolean) => {
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch {}
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp }),
      });
      if (!res.ok) throw new Error("فشل حفظ التغييرات");
      toast({ title: "تم حفظ التغييرات بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة وتأكيدها غير متطابقين", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل تغيير كلمة المرور");
      }
      toast({ title: "تم تغيير كلمة المرور بنجاح" });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-energy" />
          <span>النظام</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>الإعدادات</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1.5">تفضيلات النظام</h1>
        <p className="text-sm text-muted-foreground mt-1">قم بتخصيص تجربتك وإدارة حسابك</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          {[
            { id: "profile", label: "الحساب", icon: User },
            { id: "appearance", label: "المظهر", icon: Palette },
            { id: "system", label: "النظام", icon: Settings },
            { id: "security", label: "الأمان", icon: Shield },
          ].map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center font-semibold text-primary text-xl">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold">{user?.name || "مدرب"}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">الاسم بالكامل</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                    <Input defaultValue={user?.email || ""} disabled className="opacity-60" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">رقم واتساب (لظهور في رابط الدعم)</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="201155261969" dir="ltr" />
                </div>
                {pricingLink && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">رابط الباقات (شاركه مع عملائك)</Label>
                    <div className="flex gap-2">
                      <Input value={pricingLink} readOnly dir="ltr" className="text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(pricingLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button disabled={isSaving} onClick={handleSaveProfile}>
                    {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">تخصيص المظهر</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { value: "light", label: "الفاتح", icon: Sun },
                  { value: "dark", label: "الداكن", icon: Moon },
                  { value: "system", label: "تلقائي", icon: Monitor },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setTheme(mode.value as any)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-xl border transition-all",
                      theme === mode.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                      theme === mode.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <mode.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{mode.label}</span>
                    {theme === mode.value && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-warning" />
                  <div>
                    <p className="text-sm font-medium">تأثيرات الواجهة</p>
                    <p className="text-xs text-muted-foreground">تفعيل الظلال والتأثيرات البصرية</p>
                  </div>
                </div>
                <Switch checked={themeEffects} onCheckedChange={setThemeEffects} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <CardTitle>إشعارات النظام</CardTitle>
              </div>
              <CardDescription>تحكم في التنبيهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="text-sm font-medium">انتهاء الاشتراكات</p>
                  <p className="text-xs text-muted-foreground">تنبيه قبل الانتهاء بـ 3 أيام</p>
                </div>
                <Switch checked={subAlerts} onCheckedChange={(v) => { setSubAlerts(v); saveNotifPref("notifySubExpiry", v); }} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="text-sm font-medium">تنبيهات الدفع</p>
                  <p className="text-xs text-muted-foreground">إشعار عند استلام دفعة جديدة</p>
                </div>
                <Switch checked={payAlerts} onCheckedChange={(v) => { setPayAlerts(v); saveNotifPref("notifyPayment", v); }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <CardTitle>الأمان والخصوصية</CardTitle>
              </div>
              <CardDescription>إدارة حماية حسابك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">تغيير كلمة المرور</p>
                    <p className="text-xs text-muted-foreground">أدخل كلمة المرور الحالية والجديدة</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                  {showPasswordForm ? "إلغاء" : "تغيير"}
                </Button>
              </div>

              {showPasswordForm && (
                <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                  <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="كلمة المرور الحالية" />
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" />
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" />
                  <Button disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword} onClick={handlePasswordChange} className="w-full">
                    {isChangingPassword ? "جاري التغيير..." : "تأكيد تغيير كلمة المرور"}
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">المصادقة الثنائية</p>
                    <p className="text-xs text-muted-foreground">تأمين الحساب برمز الهاتف</p>
                  </div>
                </div>
                <Badge variant="secondary">قريباً</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">تسجيل الخروج</p>
                    <p className="text-xs text-muted-foreground">تأمين بياناتك</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  خروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
