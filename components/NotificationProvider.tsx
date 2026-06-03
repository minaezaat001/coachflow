"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./auth-context"

interface NotificationItem {
  id: number
  title: string
  message: string | null
  type: string
  isRead: boolean
  targetUrl: string
  clientId: number | null
  createdAt: string
}

interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  refreshNotifications: () => Promise<void>
  markAllAsRead: () => Promise<void>
  clearAll: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => {},
  markAllAsRead: async () => {},
  clearAll: async () => {},
  markAsRead: async () => {},
})

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const { user } = useAuth()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const refreshNotifications = fetchNotifications

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    await fetch("/api/notifications/mark-all-read", { method: "PATCH" }).catch(() => {})
  }

  const markAsRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {})
  }

  const clearAll = async () => {
    setNotifications([])
    await fetch("/api/notifications/clear-all", { method: "DELETE" }).catch(() => {})
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refreshNotifications, markAllAsRead, clearAll, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
