"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, refreshUser } = useAuth();

  React.useEffect(() => {
    if (!authLoading && user) {
      router.push(user.role === "super_admin" ? "/admin/dashboard" : "/");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "يرجى إدخال البريد الإلكتروني وكلمة المرور", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: data.error || "فشل تسجيل الدخول", variant: "destructive" });
        return;
      }

      toast({ title: "تم تسجيل الدخول بنجاح" });
      await refreshUser();
      const role = data.user?.role;
      router.push(role === "super_admin" ? "/admin/dashboard" : "/");
    } catch (error: any) {
      toast({ title: `فشل تسجيل الدخول: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4" dir="rtl">
      <div className="max-w-md w-full animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/assets/logo.png" alt="CoachFlow" width={40} height={40} className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">مرحباً بك في CoachFlow</h1>
            <p className="text-sm text-zinc-500 mt-2">سجل الدخول لإدارة عملائك ومتابعاتهم اليومية</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-700 font-medium text-sm">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="demo@coachflow.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 rounded-xl text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-700 font-medium text-sm">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11 rounded-xl text-right"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          &copy; ٢٠٢٦ CoachFlow. جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
