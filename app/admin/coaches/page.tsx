"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, MoreHorizontal, Ban, CheckCircle, Trash2, Pencil } from "lucide-react";

interface Coach {
  id: string;
  email: string;
  name: string | null;
  role: string;
  suspended: boolean;
  clientCount: number;
  createdAt: string;
}

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "" });
  const [adding, setAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Coach | null>(null);

  const fetchCoaches = useCallback(async () => {
    const res = await fetch("/api/admin/coaches");
    if (res.ok) {
      const data = await res.json();
      setCoaches(data.coaches);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoaches(); }, [fetchCoaches]);

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ name: "", email: "", password: "" });
        fetchCoaches();
      } else {
        const data = await res.json();
        alert(data.error || "فشل الإنشاء");
      }
    } catch {
      alert("فشل الاتصال");
    } finally {
      setAdding(false);
    }
  };

  const toggleSuspend = async (coach: Coach) => {
    setActionLoading(coach.id);
    try {
      const res = await fetch(`/api/admin/coaches/${coach.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !coach.suspended }),
      });
      if (res.ok) {
        setCoaches((prev) => prev.map((c) => (c.id === coach.id ? { ...c, suspended: !c.suspended } : c)));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setEditForm({ name: coach.name || "", email: coach.email });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoach) return;
    setActionLoading(editingCoach.id);
    try {
      const res = await fetch(`/api/admin/coaches/${editingCoach.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingCoach(null);
        fetchCoaches();
      } else {
        const data = await res.json();
        alert(data.error || "فشل التحديث");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCoach = async (coach: Coach) => {
    setActionLoading(coach.id);
    setShowDeleteConfirm(null);
    try {
      const res = await fetch(`/api/admin/coaches/${coach.id}`, { method: "DELETE" });
      if (res.ok) {
        setCoaches((prev) => prev.filter((c) => c.id !== coach.id));
      } else {
        const data = await res.json();
        alert(data.error || "فشل الحذف");
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">إدارة المدربين</h1>
          <p className="text-sm text-zinc-500 mt-1">جميع حسابات المدربين المسجلين في المنصة</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="rounded-xl h-10">
          <Plus className="w-4 h-4 ml-2" />
          إضافة مدرب جديد
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">الاسم</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">البريد الإلكتروني</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">الحالة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">العملاء</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">تاريخ التسجيل</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : coaches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400">
                    لا يوجد مدربون بعد
                  </td>
                </tr>
              ) : (
                coaches.map((coach) => (
                  <tr key={coach.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-zinc-900">{coach.name || "—"}</span>
                      {coach.role === "super_admin" && (
                        <span className="mr-2 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{coach.email}</td>
                    <td className="px-5 py-3.5">
                      {coach.suspended ? (
                        <Badge variant="destructive">موقوف</Badge>
                      ) : (
                        <Badge variant="success">نشط</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{coach.clientCount}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400">
                      {new Date(coach.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {coach.role !== "super_admin" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors"
                            >
                              {actionLoading === coach.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44">
                            <DropdownMenuItem onClick={() => openEdit(coach)}>
                              <Pencil className="w-4 h-4 text-zinc-500" />
                              تعديل الحساب
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleSuspend(coach)}>
                              {coach.suspended ? (
                                <><CheckCircle className="w-4 h-4 text-green-500" /> تفعيل الحساب</>
                              ) : (
                                <><Ban className="w-4 h-4 text-amber-500" /> إيقاف الحساب مؤقتاً</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowDeleteConfirm(coach)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                              حذف المدرب
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مدرب جديد</DialogTitle>
            <DialogDescription>إنشاء حساب جديد لمدرب على المنصة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCoach} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="coach-name">الاسم</Label>
              <Input id="coach-name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="اسم المدرب" className="rounded-xl h-11 text-right" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-email">البريد الإلكتروني</Label>
              <Input id="coach-email" type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="coach@example.com" className="rounded-xl h-11 text-right" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-password">كلمة المرور المبدئية</Label>
              <Input id="coach-password" type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="rounded-xl h-11 text-right" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={adding} className="rounded-xl w-full h-11">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء الحساب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCoach} onOpenChange={(o) => { if (!o) setEditingCoach(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المدرب</DialogTitle>
            <DialogDescription>{editingCoach?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">الاسم</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="اسم المدرب" className="rounded-xl h-11 text-right" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="coach@example.com" className="rounded-xl h-11 text-right" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={actionLoading === editingCoach?.id} className="rounded-xl w-full h-11">
                {actionLoading === editingCoach?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteConfirm} onOpenChange={(o) => { if (!o) setShowDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد حذف المدرب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف {showDeleteConfirm?.name || showDeleteConfirm?.email}؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="rounded-xl flex-1">
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && deleteCoach(showDeleteConfirm)}
              disabled={actionLoading === showDeleteConfirm?.id}
              className="rounded-xl flex-1"
            >
              {actionLoading === showDeleteConfirm?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
