"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Menu, X, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";

const adminNavItems = [
  { href: "/admin/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/coaches",   label: "إدارة المدربين", icon: Users },
];

function AdminNavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image src="/assets/logo.png" alt="CoachFlow" width={24} height={24} className="w-6 h-6 object-contain" />
          <span className="text-sm font-semibold tracking-tight text-white">CoachFlow</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 px-3 py-4">
        <nav className="space-y-0.5">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className={cn(
                  "flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-all duration-150 relative",
                  isActive
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}>
                  {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-blue-500" />}
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 pb-3">
        <div className="pt-2 border-t border-zinc-800">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800/50 transition-all">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="text-xs truncate">{user?.email || "تسجيل الخروج"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (user.role !== "super_admin") {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex" dir="rtl">
      <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 shrink-0 bg-zinc-900 z-40">
        <AdminNavContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 right-0 h-full w-60 z-50 bg-zinc-900 transform transition-transform duration-300 ease-out lg:hidden",
        mobileOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <AdminNavContent onClose={() => setMobileOpen(false)} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/80 backdrop-blur-sm border-b border-zinc-100 lg:hidden">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image src="/assets/logo.png" alt="CoachFlow" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="text-sm font-semibold tracking-tight">CoachFlow</span>
          </Link>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setMobileOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
        </header>

        <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
