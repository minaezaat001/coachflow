"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  CheckSquare,
  Menu,
  X,
  LogOut,
  Settings,
  MessageCircle,
  Package,
  Upload,
  UserPlus,
  Bell,
} from "lucide-react"
import { Button } from "./ui/button"
import { NotificationBell } from "./NotificationBell"
import { useAuth } from "./auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const navItems = [
  { href: "/",             label: "لوحة التحكم",       icon: LayoutDashboard },
  { href: "/leads",        label: "طلبات الاشتراك",    icon: UserPlus },
  { href: "/clients",      label: "إدارة العملاء",     icon: Users },
  { href: "/check-ins",    label: "المتابعات",          icon: CalendarCheck },
  { href: "/import",       label: "استيراد العملاء",   icon: Upload },
  { href: "/packages",     label: "باقات الاشتراك",    icon: Package },
  { href: "/payments",     label: "السجلات المالية",   icon: CreditCard },
  { href: "/todos",        label: "قائمة المهام",      icon: CheckSquare },
  { href: "/settings",     label: "الإعدادات العامة",   icon: Settings },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [whatsapp, setWhatsapp] = useState("")

  React.useEffect(() => {
    fetch("/api/public/coach").then(r => r.json()).then(d => { if (d.whatsapp) setWhatsapp(d.whatsapp) }).catch(() => {})
  }, [])

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border/50">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/assets/logo.png" alt="CoachFlow" width={24} height={24} className="w-6 h-6 object-contain" />
          <span className="text-sm font-semibold tracking-tight text-white">CoachFlow</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell align="start" />
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 px-3 flex-1">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-all duration-150 relative",
                    isActive
                      ? "bg-sidebar-accent text-white font-medium"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                  )}
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}

        </nav>
      </div>

      <div className="px-3 pb-3 space-y-0.5">
        {whatsapp && (
          <Link href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً ${user?.name || "المدرب"}، أحتاج إلى مساعدة بخصوص حسابي في CoachFlow`)}`} target="_blank" rel="noopener noreferrer">
            <div className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all">
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs">تواصل مع الدعم</span>
            </div>
          </Link>
        )}

        <div className="pt-2 mt-2 border-t border-sidebar-border/50">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-sidebar-foreground/40 hover:text-red-400 hover:bg-sidebar-accent/50 transition-all"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-xs truncate">{user?.email || "تسجيل الخروج"}</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-black">تسجيل الخروج</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium">
                  هل أنت متأكد من تسجيل الخروج؟ سيتم إنهاء جلستك الحالية.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={signOut} className="rounded-xl font-bold bg-red-500 hover:bg-red-600">
                  تأكيد
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 shrink-0 bg-sidebar z-40">
        <NavContent />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-60 z-50 bg-sidebar transform transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <NavContent onClose={() => setMobileOpen(false)} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur-sm lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/assets/logo.png" alt="CoachFlow" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="text-sm font-semibold tracking-tight">CoachFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell align="start" />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
