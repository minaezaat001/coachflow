"use client";

import React, { useEffect, useState } from "react";
import { Shield, CheckCircle, Ban, Users, DollarSign } from "lucide-react";

interface Stats {
  totalCoaches: number;
  activeCoaches: number;
  suspendedCoaches: number;
  totalClients: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(async (res) => {
      if (res.ok) setStats(await res.json());
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">نظرة عامة</h1>
        <p className="text-sm text-zinc-500 mt-1">إحصائيات منصة CoachFlow</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-zinc-100 mb-3" />
              <div className="h-3 w-20 bg-zinc-100 rounded mb-2" />
              <div className="h-6 w-12 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">إجمالي المدربين</p>
                <p className="text-xl font-bold text-zinc-900">{stats?.totalCoaches || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">مدربون نشطاء</p>
                <p className="text-xl font-bold text-zinc-900">{stats?.activeCoaches || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">مدربون موقوفون</p>
                <p className="text-xl font-bold text-zinc-900">{stats?.suspendedCoaches || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">إجمالي العملاء</p>
                <p className="text-xl font-bold text-zinc-900">{stats?.totalClients || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">الإيرادات الكلية</p>
                <p className="text-xl font-bold text-zinc-900">{stats?.totalRevenue?.toLocaleString() || 0} ج.م</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
