"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
        <div className="p-8 text-center text-slate-500">
          Pengajuan tidak ditemukan.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/admin/pengajuan"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2"
          >
            ← Kembali ke Daftar Pengajuan
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Detail Pengajuan #{request.id.slice(-8)}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Diajukan pada {new Date(request.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
            <Badge status={request.status} size="md" />
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Item & Request details */}
          <div className="md:col-span-2 space-y-6">
            <Card title="Barang & Kebutuhan yang Diminta">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nama Barang ATK
                    </span>
                    <span className="text-base font-bold text-slate-900 mt-0.5 block">
                      {request.atkItem.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Jumlah Diminta
                    </span>
                    <span className="text-base font-bold text-indigo-600 mt-0.5 block">
                      {request.quantity} {request.atkItem.unit}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Alasan / Keperluan Karyawan
                  </span>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-xs">
                    {request.reason}
                  </div>
                </div>

                {request.adminNote && (
                  <div>
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1.5">
                      Catatan / Alasan Penolakan Admin
                    </span>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      {request.adminNote}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Ubah Status Pengajuan">
              <div className="flex flex-wrap items-center gap-2">
                {request.status !== "MENUNGGU" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={() => handleUpdateStatus("MENUNGGU")}
                  >
                    🟡 Set Menunggu
                  </Button>
                )}

                {request.status !== "DISETUJUI" && (
                  <Button
                    variant="success"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={() => handleUpdateStatus("DISETUJUI")}
                  >
                    ✓ Setujui Pengajuan
                  </Button>
                )}

                {request.status !== "DIPROSES" && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={() => handleUpdateStatus("DIPROSES")}
                  >
                    ⚙️ Mulai Proses
                  </Button>
                )}

                {request.status !== "SELESAI" && (
                  <Button
                    variant="success"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={() => handleUpdateStatus("SELESAI")}
                  >
                    🏁 Tandai Selesai
                  </Button>
                )}

                {request.status !== "DITOLAK" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRejectModalOpen(true)}
                  >
                    ✕ Tolak Pengajuan
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Col: Applicant Info */}
          <div className="space-y-6">
            <Card title="Informasi Pemohon">
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Nama Lengkap</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {request.user.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Departemen</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {request.user.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Jabatan</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {request.user.position}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Email</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {request.user.email}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Riwayat Audit">
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Tanggal Pengajuan</span>
                  <span className="text-slate-700 mt-0.5 block font-mono">
                    {new Date(request.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Terakhir Diproses</span>
                  <span className="text-slate-700 mt-0.5 block font-mono">
                    {new Date(request.updatedAt).toLocaleString("id-ID")}
                  </span>
                </div>
                {request.processor && (
                  <div>
                    <span className="text-slate-400 font-medium block">Diproses Oleh</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
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
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isProcessing}
                onClick={() => {
                  if (!rejectNote.trim()) {
                    toast.error("Alasan penolakan wajib diisi!");
                    return;
                  }
                  handleUpdateStatus("DITOLAK", rejectNote.trim());
                }}
              >
                Konfirmasi Tolak
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
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
