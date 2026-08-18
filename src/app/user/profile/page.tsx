"use client";

import React, { useState, useEffect } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Loading";
import type { UserProfile } from "@/types/user";

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    disetujui: 0,
    selesai: 0,
    ditolak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const [meRes, statsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/requests/stats"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setProfile(meData.user);
        }

        if (statsRes.ok) {
          const sData = await statsRes.json();
          if (sData.requests) setStats(sData.requests);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <UserLayout>
        <PageLoader message="Memuat profil karyawan..." />
      </UserLayout>
    );
  }

  if (!profile) {
    return (
      <UserLayout>
        <div className="p-8 text-center text-slate-500">
          Gagal memuat informasi profil.
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Profil Karyawan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Informasi akun dan riwayat aktivitas Anda pada sistem pengajuan ATK.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Cover Header */}
          <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 relative px-6 flex items-end">
            <div className="absolute -bottom-8 left-6 flex items-end gap-4">
              <div className="w-18 h-18 rounded-2xl bg-slate-900 border-4 border-white text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="pt-11 pb-6 px-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={profile.role} size="md" />
                <Badge status="ACTIVE" size="md" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Departemen / Divisi
                </span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">
                  {profile.department}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jabatan / Posisi
                </span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">
                  {profile.position}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Akun
                </span>
                <span className="text-sm font-semibold text-emerald-600 mt-1 block">
                  Aktif (Terverifikasi)
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ID Karyawan
                </span>
                <span className="text-xs font-mono font-medium text-slate-700 mt-1 block">
                  {profile.id}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hak Akses
                </span>
                <span className="text-xs font-medium text-slate-700 mt-1 block">
                  Pengajuan Karyawan (Portal Standard)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <Card title="Ringkasan Pengajuan Saya">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <StatCard
              title="Total Dibuat"
              value={stats.total}
              color="indigo"
            />
            <StatCard
              title="Menunggu Review"
              value={stats.menunggu}
              color="amber"
            />
            <StatCard
              title="Disetujui"
              value={stats.disetujui}
              color="blue"
            />
            <StatCard
              title="Selesai Diterima"
              value={stats.selesai}
              color="emerald"
            />
          </div>
        </Card>
      </div>
    </UserLayout>
  );
}
