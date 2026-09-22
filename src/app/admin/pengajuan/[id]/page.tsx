"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoader } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import type { AtkRequestData, RequestStatusType } from "@/types/request";

export default function DetailPengajuanAdminPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const toast = useToast();

  const [request, setRequest] = useState<AtkRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data.data);
      } else {
        toast.error("Pengajuan tidak ditemukan");
        router.push("/admin/pengajuan");
      }
    } catch (err) {
      console.error("Fetch request error:", err);
      toast.error("Gagal memuat detail pengajuan");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (id) fetchRequest();
  }, [id, fetchRequest]);

  const handleUpdateStatus = async (
    status: RequestStatusType,
    adminNote?: string
  ) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah status");
        return;
      }

      toast.success(data.message || `Status berhasil diubah menjadi ${status}`);
      setRejectModalOpen(false);
      setRejectNote("");
      fetchRequest();
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Terjadi gangguan koneksi");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <PageLoader message="Memuat detail pengajuan..." />
      </AdminLayout>
    );
  }

  if (!request) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-[#606c80] text-xs font-medium">
          Pengajuan tidak ditemukan.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/pengajuan"
              className="text-xs font-bold text-[#ff8f00] hover:text-[#e07d00] flex items-center gap-1.5 mb-2 transition"
            >
              ← Kembali ke Daftar Pengajuan
            </Link>
            <h1 className="text-xl sm:text-[22px] font-black text-[#323c4d] tracking-tight">
              Detail Pengajuan #{request.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-[#606c80] font-semibold mt-0.5">
              Diajukan pada {new Date(request.createdAt).toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <Badge status={request.status} size="md" />
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Item & Request details */}
          <div className="md:col-span-2 space-y-6">
            <Card title="Barang & Kebutuhan yang Diminta">
              <div className="space-y-4">
                <div className="p-4 rounded-[8px] bg-slate-50/70 border border-[#ebeef2] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#606c80] uppercase tracking-wider block">
                      Nama Barang ATK
                    </span>
                    <span className="text-base font-black text-[#323c4d] mt-0.5 block">
                      {request.atkItem.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-[#606c80] uppercase tracking-wider block">
                      Jumlah Diminta
                    </span>
                    <span className="text-base font-black text-[#ff8f00] mt-0.5 block">
                      {request.quantity} {request.atkItem.unit}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#606c80] uppercase tracking-wider block mb-1.5">
                    Alasan / Keperluan Karyawan
                  </span>
                  <div className="p-4 rounded-[8px] bg-white border border-[#ebeef2] text-xs text-[#323c4d] font-medium leading-relaxed shadow-2xs">
                    {request.reason || <span className="text-[#606c80] italic">Tidak ada catatan spesifik.</span>}
                  </div>
                </div>

                {request.adminNote && (
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                      Catatan / Alasan Penolakan Admin
                    </span>
                    <div className="p-4 rounded-[8px] bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 font-medium leading-relaxed">
                      {request.adminNote}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Ubah Status Pengajuan">
              <div className="flex flex-wrap items-center gap-2">
                {request.status !== "DIPROSES" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus("DIPROSES")}
                    className="px-3.5 py-2 rounded-[8px] text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Set Diproses</span>
                  </button>
                )}

                {request.status !== "SELESAI" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus("SELESAI")}
                    className="px-4 py-2 rounded-[8px] text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tandai Selesai</span>
                  </button>
                )}

                {request.status !== "DITOLAK" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setRejectModalOpen(true)}
                    className="px-3.5 py-2 rounded-[8px] text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>✕</span>
                    <span>Tolak Pengajuan</span>
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Col: Applicant Info */}
          <div className="space-y-6">
            <Card title="Informasi Pemohon">
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider block">Nama Lengkap</span>
                  <span className="font-bold text-[#323c4d] mt-0.5 block">
                    {request.user.name}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider block">Departemen</span>
                  <span className="font-bold text-[#323c4d] mt-0.5 block">
                    {request.user.department}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider block">Jabatan</span>
                  <span className="font-bold text-[#323c4d] mt-0.5 block">
                    {request.user.position || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider block">Email</span>
                  <span className="font-bold text-[#323c4d] mt-0.5 block">
                    {request.user.email || "-"}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Riwayat Audit">
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider block">Tanggal Pengajuan</span>
                  <span className="text-[#323c4d] font-semibold mt-0.5 block">
                    {new Date(request.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider block">Terakhir Diproses</span>
                  <span className="text-[#323c4d] font-semibold mt-0.5 block">
                    {new Date(request.updatedAt).toLocaleString("id-ID")}
                  </span>
                </div>
                {request.processor && (
                  <div>
                    <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider block">Diproses Oleh</span>
                    <span className="font-bold text-[#323c4d] mt-0.5 block">
                      {request.processor.name}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Tolak Pengajuan ATK"
          subtitle={`Pemohon: ${request.user.name}`}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-[8px] border border-[#ebeef2] text-[#323c4d] hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  if (!rejectNote.trim()) {
                    toast.error("Alasan penolakan wajib diisi!");
                    return;
                  }
                  handleUpdateStatus("DITOLAK", rejectNote.trim());
                }}
                className="px-4 py-2 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Konfirmasi Tolak
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-[#606c80] font-medium leading-relaxed">
              Mohon berikan alasan penolakan yang jelas agar karyawan mengetahui alasan penolakan ini.
            </p>
            <Textarea
              label="Alasan Penolakan"
              required
              rows={4}
              placeholder="Contoh: Stok sedang tidak mencukupi untuk divisi ini..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
