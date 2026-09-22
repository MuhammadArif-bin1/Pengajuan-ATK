"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { AtkRequestData, RequestStatusType } from "@/types/request";

export default function AdminDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState({
    regular: { total: 0, diproses: 0, selesai: 0, ditolak: 0 },
    purchase: { total: 0, diproses: 0, selesai: 0, ditolak: 0 },
  });
  const [recentRequests, setRecentRequests] = useState<AtkRequestData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Prevent overlapping background requests
  const isFetchingRef = useRef(false);

  const loadDashboardData = useCallback(
    async (showLoading = true) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (showLoading) setLoading(true);

        const [statsRes, requestsRes] = await Promise.all([
          fetch("/api/requests/stats"),
          fetch("/api/requests?limit=6&type=regular"),
        ]);

        if (statsRes.ok) {
          const sData = await statsRes.json();
          setStats((prev) => ({
            regular: sData.regular || sData.requests || prev.regular,
            purchase: sData.purchase || prev.purchase,
          }));
        }

        if (requestsRes.ok) {
          const rData = await requestsRes.json();
          if (Array.isArray(rData.data)) {
            setRecentRequests(rData.data);
          }
        }
      } catch (err) {
        console.error("Admin dashboard data fetch error:", err);
        if (showLoading) {
          toast.error("Gagal memuat data dashboard");
        }
      } finally {
        if (showLoading) setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [toast]
  );

  useEffect(() => {
    // Initial fetch displays loading skeleton/indicator
    loadDashboardData(true);

    // Silent background auto-refresh every 30s only when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDashboardData(false);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadDashboardData]);

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
      loadDashboardData(false);
    } catch (err) {
      console.error("Update request status error:", err);
      toast.error("Terjadi gangguan koneksi");
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISETUJUI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Selesai
          </span>
        );
      case "DITOLAK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Ditolak
          </span>
        );
      case "DIPROSES":
      case "MENUNGGU":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Diproses
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      {/* ─── STAT CARDS GRID (2 Columns) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Total Pengajuan ATK (Permintaan Gudang) */}
        <Link
          href="/admin/pengajuan"
          className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-5 sm:p-6 hover:border-[#ff8f00]/50 transition-all flex flex-col justify-between block group"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-[#606c80] uppercase tracking-wider">
              TOTAL PENGAJUAN ATK
            </span>
            <div className="w-9 h-9 rounded-[8px] bg-orange-50 text-[#ff8f00] border border-orange-100/60 flex items-center justify-center transition group-hover:scale-105">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-3xl sm:text-4xl font-black text-[#323c4d] tracking-tight">
              {stats.regular.total}
            </h2>
            <p className="text-xs text-[#606c80] font-medium mt-1">
              Permohonan permintaan ATK dari stok gudang
            </p>
          </div>

          {/* Status Quick Badges */}
          <div className="mt-5 pt-4 border-t border-[#ebeef2] flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Diproses: {stats.regular.diproses}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Selesai: {stats.regular.selesai}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Ditolak: {stats.regular.ditolak}
            </span>
          </div>
        </Link>

        {/* Card 2: Pengajuan Pembelian ATK */}
        <Link
          href="/admin/barang"
          className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-5 sm:p-6 hover:border-[#ff8f00]/50 transition-all flex flex-col justify-between block group"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-[#606c80] uppercase tracking-wider">
              TOTAL PENGAJUAN PEMBELIAN ATK
            </span>
            <div className="w-9 h-9 rounded-[8px] bg-slate-100 text-[#323c4d] border border-slate-200/60 flex items-center justify-center transition group-hover:scale-105">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-3xl sm:text-4xl font-black text-[#323c4d] tracking-tight">
              {stats.purchase.total}
            </h2>
            <p className="text-xs text-[#606c80] font-medium mt-1">
              Permohonan pengadaan & pembelian barang baru
            </p>
          </div>

          {/* Status Quick Badges */}
          <div className="mt-5 pt-4 border-t border-[#ebeef2] flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Diproses: {stats.purchase.diproses}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Selesai: {stats.purchase.selesai}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Ditolak: {stats.purchase.ditolak}
            </span>
          </div>
        </Link>
      </div>

      {/* ─── TABLE CARD: Pengajuan ATK Terbaru ─── */}
      <div className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] overflow-hidden">
        {/* Table Card Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#ebeef2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#323c4d] tracking-tight">
              Pengajuan ATK Terbaru
            </h2>
            <p className="text-xs text-[#606c80] font-medium mt-0.5">
              Daftar permohonan ATK yang baru diajukan karyawan
            </p>
          </div>

          <Link
            href="/admin/pengajuan"
            className="text-xs font-bold text-[#ff8f00] hover:text-[#e07d00] flex items-center gap-1.5 self-start sm:self-auto transition"
          >
            <span>Kelola Semua Pengajuan</span>
            <span>→</span>
          </Link>
        </div>

        {/* Table Content */}
        {loading && recentRequests.length === 0 ? (
          <div className="py-16 text-center text-[#606c80] text-xs font-medium">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat data pengajuan...
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="py-16 text-center text-[#606c80] text-xs font-medium">
            Belum ada data pengajuan yang masuk.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#ebeef2] bg-slate-50/70">
                  <th className="text-left px-5 sm:px-6 py-3.5 font-bold text-[#606c80] uppercase tracking-wider text-[10px]">
                    PEMOHON
                  </th>
                  <th className="text-left px-5 sm:px-6 py-3.5 font-bold text-[#606c80] uppercase tracking-wider text-[10px]">
                    BARANG DIAJUKAN
                  </th>
                  <th className="text-left px-5 sm:px-6 py-3.5 font-bold text-[#606c80] uppercase tracking-wider text-[10px]">
                    STATUS
                  </th>
                  <th className="text-left px-5 sm:px-6 py-3.5 font-bold text-[#606c80] uppercase tracking-wider text-[10px]">
                    TANGGAL
                  </th>
                  <th className="text-right px-5 sm:px-6 py-3.5 font-bold text-[#606c80] uppercase tracking-wider text-[10px]">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebeef2]">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 sm:px-6 py-4">
                      <p className="font-bold text-[#323c4d] text-xs">{req.user.name}</p>
                      <p className="text-[11px] text-[#606c80] font-medium mt-0.5">
                        {req.user.department} • {req.user.position}
                      </p>
                    </td>
                    <td className="px-5 sm:px-6 py-4">
                      <p className="font-bold text-[#323c4d] text-xs">{req.atkItem.name}</p>
                      <p className="text-[11px] text-[#ff8f00] font-black mt-0.5">
                        {req.quantity} {req.atkItem.unit}
                      </p>
                    </td>
                    <td className="px-5 sm:px-6 py-4">{statusBadge(req.status)}</td>
                    <td className="px-5 sm:px-6 py-4 text-[#606c80] text-xs font-medium">
                      {new Date(req.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 rounded-[8px] border border-[#ebeef2] text-[#323c4d] hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
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

      {/* ─── DETAIL & AKSI MODAL ─── */}
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
                className="px-4 py-2 rounded-[8px] border border-[#ebeef2] text-[#323c4d] hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                {selectedRequest.status !== "DIPROSES" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus(selectedRequest.id, "DIPROSES")}
                    className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Set Diproses</span>
                  </button>
                )}

                {selectedRequest.status !== "DITOLAK" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setRejectModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>✕</span>
                    <span>Tolak</span>
                  </button>
                )}

                {selectedRequest.status !== "SELESAI" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus(selectedRequest.id, "SELESAI")}
                    className="px-4 py-1.5 rounded-[8px] text-xs font-bold text-white bg-[#01923f] hover:bg-[#017a35] shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tandai Selesai</span>
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Status Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-slate-50/70 rounded-[8px] border border-[#ebeef2]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#606c80] uppercase tracking-wider">Status Permohonan:</span>
                {statusBadge(selectedRequest.status)}
              </div>
              <div className="text-[11px] font-semibold text-[#606c80] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#606c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

            {/* 1. Data Pemohon Card */}
            <div className="p-4 bg-white rounded-[10px] border border-[#ebeef2]">
              <h4 className="text-xs font-black text-[#323c4d] uppercase tracking-wider mb-3 pb-2 border-b border-[#ebeef2] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff8f00]" />
                Data Pemohon (Karyawan)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50/60 rounded-[8px] border border-[#ebeef2]">
                  <p className="text-[11px] font-semibold text-[#606c80] mb-0.5">Nama Lengkap</p>
                  <p className="text-xs font-bold text-[#323c4d]">{selectedRequest.user.name}</p>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-[8px] border border-[#ebeef2]">
                  <p className="text-[11px] font-semibold text-[#606c80] mb-0.5">Departemen / Divisi</p>
                  <p className="text-xs font-bold text-[#323c4d]">{selectedRequest.user.department}</p>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-[8px] border border-[#ebeef2]">
                  <p className="text-[11px] font-semibold text-[#606c80] mb-0.5">Jabatan</p>
                  <p className="text-xs font-bold text-[#323c4d]">{selectedRequest.user.position || "-"}</p>
                </div>
              </div>
            </div>

            {/* 2. Detail Barang Yang Diajukan Card */}
            <div className="p-4 bg-white rounded-[10px] border border-[#ebeef2]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#ebeef2]">
                <h4 className="text-xs font-black text-[#323c4d] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff8f00]" />
                  Detail Barang Yang Diajukan
                </h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-orange-50 text-[#ff8f00] border border-orange-200/60">
                  Permintaan Gudang
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/70 rounded-[8px] border border-[#ebeef2]">
                <div>
                  <p className="text-sm font-black text-[#323c4d]">{selectedRequest.atkItem.name}</p>
                  <p className="text-[11px] font-semibold text-[#606c80] mt-0.5">
                    Satuan: {selectedRequest.atkItem.unit || "pcs"}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-xs text-[#606c80] font-semibold">Jumlah Permintaan:</span>
                  <span className="px-3 py-1 bg-white text-[#ff8f00] font-black text-xs rounded-[6px] border border-orange-200/70 shadow-2xs">
                    {selectedRequest.quantity} {selectedRequest.atkItem.unit || "pcs"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Alasan / Keperluan Card */}
            <div className="p-4 bg-white rounded-[10px] border border-[#ebeef2]">
              <h4 className="text-xs font-black text-[#323c4d] uppercase tracking-wider mb-2.5 pb-2 border-b border-[#ebeef2] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff8f00]" />
                Alasan / Keperluan Pengguna
              </h4>

              <div className="p-3 bg-slate-50/60 rounded-[8px] border border-[#ebeef2] text-xs text-[#323c4d] leading-relaxed font-medium">
                {selectedRequest.reason ? (
                  <p className="whitespace-pre-line">{selectedRequest.reason}</p>
                ) : (
                  <p className="text-[#606c80] italic">Tidak ada catatan / alasan spesifik.</p>
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
          <div className="space-y-4 text-xs">
            <p className="text-[#606c80] font-medium leading-relaxed">
              Silakan masukkan alasan penolakan pengajuan untuk <b className="text-[#323c4d]">{selectedRequest.user.name}</b>:
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Stok tidak mencukupi atau kuota divisi telah habis..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="w-full rounded-[8px] border border-[#ebeef2] p-3 text-xs text-[#323c4d] bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 font-medium"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-[8px] border border-[#ebeef2] text-[#323c4d] text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || !rejectNote.trim()}
                onClick={() => handleUpdateStatus(selectedRequest.id, "DITOLAK", rejectNote)}
                className="px-4 py-2 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
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
