"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { AtkRequestData, RequestStatusType } from "@/types/request";

export default function AdminDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState({
    regular: { total: 0, menunggu: 0, disetujui: 0, diproses: 0, selesai: 0, ditolak: 0 },
    purchase: { total: 0, menunggu: 0, disetujui: 0, diproses: 0, selesai: 0, ditolak: 0 },
  });
  const [recentRequests, setRecentRequests] = useState<AtkRequestData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [regularStatsRes, purchaseStatsRes, requestsRes] = await Promise.all([
        fetch("/api/requests/stats?type=regular"),
        fetch("/api/requests/stats?type=purchase"),
        fetch("/api/requests?limit=6"),
      ]);

      if (regularStatsRes.ok && purchaseStatsRes.ok) {
        const regData = await regularStatsRes.json();
        const purData = await purchaseStatsRes.json();
        setStats({
          regular: regData.requests || stats.regular,
          purchase: purData.requests || stats.purchase,
        });
      }

      if (requestsRes.ok) {
        const rData = await requestsRes.json();
        if (rData.data) setRecentRequests(rData.data);
      }
    } catch (err) {
      console.error("Admin dashboard data fetch error:", err);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);

    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleUpdateStatus = async (
    requestId: string,
    status: RequestStatusType,
    adminNote?: string
  ) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui status pengajuan");
        return;
      }

      toast.success(data.message || `Status berhasil diubah ke ${status}`);
      setSelectedRequest(null);
      setRejectModalOpen(false);
      setRejectNote("");
      loadDashboardData();
    } catch (err) {
      console.error("Update request status error:", err);
      toast.error("Terjadi gangguan koneksi");
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">MENUNGGU</span>;
      case "DISETUJUI":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800">DISETUJUI</span>;
      case "DIPROSES":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-orange-100 text-orange-800">DIPROSES</span>;
      case "SELESAI":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">SELESAI</span>;
      case "DITOLAK":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-100 text-red-800">DITOLAK</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Indonesian Date Formatting (e.g. Selasa, 18 Agustus 2026)
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AdminLayout>
      {/* ─── HERO CARD ─── */}
      <div className="bg-white border border-gray-200/70 rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Selamat Datang di Portal Admin HasamitraJabar
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            {todayFormatted}
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
        >
          <svg className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ─── STAT CARDS GRID (2 Columns) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Total Pengajuan ATK (Permintaan Gudang) */}
        <Link
          href="/admin/pengajuan"
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:border-[#FF5500]/50 hover:shadow-md transition-all flex flex-col justify-between block"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              TOTAL PENGAJUAN ATK
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5500] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {stats.regular.total}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Permohonan permintaan ATK dari stok gudang
            </p>
          </div>
        </Link>

        {/* Card 2: Pengajuan Pembelian ATK */}
        <Link
          href="/admin/barang"
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:border-[#FF5500]/50 hover:shadow-md transition-all flex flex-col justify-between block"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              TOTAL PENGAJUAN PEMBELIAN ATK
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {stats.purchase.total}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Permohonan pengadaan & pembelian barang baru
            </p>
          </div>
        </Link>
      </div>

      {/* ─── TABLE CARD: Pengajuan ATK Terbaru ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Card Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pengajuan ATK Terbaru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Daftar permohonan ATK yang baru diajukan karyawan
            </p>
          </div>

          <Link
            href="/admin/pengajuan"
            className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Kelola Semua Pengajuan</span>
            <span>→</span>
          </Link>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Memuat data pengajuan...
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Belum ada data pengajuan yang masuk.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left px-6 py-3.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    PEMOHON
                  </th>
                  <th className="text-left px-6 py-3.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    BARANG DIAJUKAN
                  </th>
                  <th className="text-left px-6 py-3.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    STATUS
                  </th>
                  <th className="text-left px-6 py-3.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    TANGGAL
                  </th>
                  <th className="text-right px-6 py-3.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-xs">{req.user.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {req.user.department} • {req.user.position}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 text-xs">{req.atkItem.name}</p>
                      <p className="text-[11px] text-[#FF5500] font-bold mt-0.5">
                        {req.quantity} {req.atkItem.unit}
                      </p>
                    </td>
                    <td className="px-6 py-4">{statusBadge(req.status)}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                      {new Date(req.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Detail & Aksi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── DETAIL & AKSI MODAL (Executive & Mobile-Optimized) ─── */}
      {selectedRequest && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          title="Review Pengajuan ATK"
          subtitle={`Tiket: #${selectedRequest.id.slice(-8).toUpperCase()} • Pemohon: ${selectedRequest.user.name}`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                {selectedRequest.status !== "MENUNGGU" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus(selectedRequest.id, "MENUNGGU")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>🟡</span>
                    <span>Set Menunggu</span>
                  </button>
                )}

                {selectedRequest.status !== "DIPROSES" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus(selectedRequest.id, "DIPROSES")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>⚙️</span>
                    <span>Proses</span>
                  </button>
                )}

                {selectedRequest.status !== "SELESAI" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus(selectedRequest.id, "SELESAI")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>🏁</span>
                    <span>Selesai</span>
                  </button>
                )}

                {selectedRequest.status !== "DITOLAK" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setRejectModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>✕</span>
                    <span>Tolak</span>
                  </button>
                )}

                {selectedRequest.status !== "DISETUJUI" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus(selectedRequest.id, "DISETUJUI")}
                    className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Setujui Permohonan</span>
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-3.5 sm:space-y-4">
            {/* ─── STATUS HEADER BAR ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Permohonan:</span>
                {statusBadge(selectedRequest.status)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(selectedRequest.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} WIB
                </span>
              </div>
            </div>

            {/* ─── 1. DATA PEMOHON CARD ─── */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF5500] flex items-center justify-center text-xs font-bold">
                  👤
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Data Pemohon (Karyawan)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Nama Lengkap</p>
                  <p className="text-xs font-bold text-slate-900">{selectedRequest.user.name}</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Departemen / Divisi</p>
                  <p className="text-xs font-bold text-slate-900">{selectedRequest.user.department}</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Jabatan</p>
                  <p className="text-xs font-bold text-slate-900">{selectedRequest.user.position}</p>
                </div>
              </div>
            </div>

            {/* ─── 2. DETAIL BARANG YANG DIAJUKAN CARD ─── */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5 sm:mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF5500] flex items-center justify-center text-xs font-bold">
                    📦
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Detail Barang Yang Diajukan
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-[#FF5500]">
                  Permintaan Gudang
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-orange-50/40 rounded-xl border border-orange-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-lg shrink-0">
                    📋
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{selectedRequest.atkItem.name}</p>
                    <p className="text-[11px] font-medium text-slate-500">Satuan: {selectedRequest.atkItem.unit || "pcs"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-xs text-slate-500 font-semibold">Jumlah Permintaan:</span>
                  <span className="px-3 py-1 bg-white text-[#FF5500] font-extrabold text-xs rounded-lg border border-orange-200 shadow-2xs">
                    {selectedRequest.quantity} {selectedRequest.atkItem.unit || "pcs"}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── 3. ALASAN & KEPERLUAN CARD ─── */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  💬
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Alasan / Keperluan Pengguna
                </h4>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed font-medium">
                {selectedRequest.reason ? (
                  <p className="whitespace-pre-line">{selectedRequest.reason}</p>
                ) : (
                  <p className="text-slate-400 italic">Tidak ada catatan / alasan spesifik.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <Modal
          isOpen={true}
          onClose={() => setRejectModalOpen(false)}
          title="Tolak Pengajuan ATK"
          size="sm"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-gray-600">
              Silakan masukkan alasan penolakan pengajuan untuk <b>{selectedRequest.user.name}</b>:
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Stok tidak mencukupi atau kuota divisi telah habis..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || !rejectNote.trim()}
                onClick={() => handleUpdateStatus(selectedRequest.id, "DITOLAK", rejectNote)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
