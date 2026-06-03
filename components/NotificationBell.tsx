"use client"

import React, { useState } from "react"
import { Bell, X, Calendar, CreditCard, CheckSquare, Dumbbell, Trash2, CheckCheck, Sparkles, Clock, ChevronLeft, ClipboardList, Users } from "lucide-react"
import { useNotifications } from "./NotificationProvider"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

interface NotificationBellProps {
  align?: "start" | "end"
}

const typeIcons: Record<string, React.ReactNode> = {
  subscription: <CreditCard className="w-5 h-5" />,
  followup: <Calendar className="w-5 h-5" />,
  payment: <CreditCard className="w-5 h-5" />,
  checkin: <ClipboardList className="w-5 h-5" />,
  workout: <Dumbbell className="w-5 h-5" />,
  onboarding: <ClipboardList className="w-5 h-5" />,
  todo: <CheckSquare className="w-5 h-5" />,
  lead: <Users className="w-5 h-5" />,
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

export const NotificationBell: React.FC<NotificationBellProps> = ({ align = "end" }) => {
  const { notifications, unreadCount, markAllAsRead, clearAll, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id)
    if (n.targetUrl) {
      router.push(n.targetUrl)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-12 w-12 rounded-2xl transition-all duration-300",
          isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn("w-6 h-6", unreadCount > 0 && "animate-bounce-subtle")} />
        {unreadCount > 0 && (
          <span className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/5 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className={cn(
            "mt-4 w-96 bg-card/90 backdrop-blur-2xl border border-border/50 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500",
            "md:absolute",
            align === "start" ? "md:start-0 md:origin-top-start" : "md:end-0 md:origin-top-end",
            "fixed inset-x-4 top-20 md:top-auto md:inset-x-auto md:w-96 w-auto max-w-[calc(100vw-2rem)] mx-auto md:mx-0"
          )}>
            <div className="px-6 py-5 border-b border-border/40 bg-muted/20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-widest">التنبيهات</h3>
                    <p className="text-[10px] font-bold text-muted-foreground opacity-60">لديك {unreadCount} تنبيه جديد</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[9px] font-black uppercase tracking-widest px-4 gap-2 bg-background/50 border border-border/40 rounded-xl hover:bg-primary/10 hover:text-primary"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    تحديد كالمقروء
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[9px] font-black uppercase tracking-widest px-4 gap-2 bg-background/50 border border-border/40 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    onClick={clearAll}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    مسح الكل
                  </Button>
                </div>
              )}
            </div>

            <div className="max-h-[480px] overflow-y-auto scrollbar-hide bg-transparent p-2">
              {notifications.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-muted/10 border border-dashed border-border/50 flex items-center justify-center mx-auto mb-6 opacity-30">
                    <Bell className="w-10 h-10" />
                  </div>
                  <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">هدوء تام هنا...</h4>
                  <p className="text-[10px] text-muted-foreground/60 font-bold mt-2">لا توجد تنبيهات جديدة في الوقت الحالي.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n, i) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "w-full text-start p-4 rounded-[1.5rem] transition-all flex gap-4 relative group animate-fade-up",
                        !n.isRead ? "bg-primary/5 hover:bg-primary/10 border border-primary/10" : "hover:bg-muted/30"
                      )}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {!n.isRead && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                      )}

                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                        n.type === "subscription" ? "bg-red-500/10 text-red-500 shadow-red-500/10" :
                        n.type === "payment" ? "bg-red-500/10 text-red-500 shadow-red-500/10" :
                        n.type === "followup" ? "bg-blue-500/10 text-blue-500 shadow-blue-500/10" :
                        n.type === "workout" ? "bg-purple-500/10 text-purple-500 shadow-purple-500/10" :
                        n.type === "checkin" ? "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10" :
                        n.type === "onboarding" ? "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10" :
                        n.type === "lead" ? "bg-amber-500/10 text-amber-500 shadow-amber-500/10" :
                        "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10"
                      )}>
                        {typeIcons[n.type] || <Bell className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1.5 overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-xs leading-none truncate tracking-tight", !n.isRead ? "font-black text-foreground" : "font-bold text-muted-foreground")}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground opacity-50 uppercase shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDate(n.createdAt)}
                          </div>
                        </div>
                        {n.message && (
                          <p className="text-[11px] text-muted-foreground/80 font-medium leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[9px] font-black text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                          عرض التفاصيل
                          <ChevronLeft className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-6 py-4 border-t border-border/40 bg-muted/10 text-center">
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">تنبيهات النظام الذكية — coachflow Pro</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
