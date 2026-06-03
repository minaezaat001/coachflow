"use client"

import React, { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "./auth-context"

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      if (pathname !== "/login") router.push("/login")
      return
    }

    // super_admin trying to access coach routes → redirect to admin
    if (user.role === "super_admin" && !pathname.startsWith("/admin")) {
      router.push("/admin/dashboard")
      return
    }

    // coach trying to access admin routes → redirect to home
    if (user.role !== "super_admin" && pathname.startsWith("/admin")) {
      router.push("/")
      return
    }
  }, [loading, user, pathname, router])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user && pathname !== "/login") {
    return null
  }

  // Block super_admin from seeing coach layout content
  if (user?.role === "super_admin") {
    return null
  }

  return <>{children}</>
}
