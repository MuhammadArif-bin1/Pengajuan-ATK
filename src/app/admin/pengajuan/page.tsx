"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import type { AtkRequestData, RequestStatusType } from "@/types/request";

export default function AdminPengajuanPage() {
  const toast = useToast();

  const [requests, setRequests] = useState<AtkRequestData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/users/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (departmentFilter) params.set("department", departmentFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
      toast.error("Gagal memuat daftar pengajuan");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, departmentFilter, startDate, endDate, toast]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
        toast.error(data.error || "Gagal mengubah status");
        return;
      }

      toast.success(data.message || `Status berhasil diubah menjadi ${status}`);
      setSelectedRequest(null);
      setRejectModalOpen(false);
      setRejectNote("");
      fetchRequests();
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Terjadi gangguan koneksi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDepartmentFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const columns: Column<AtkRequestData>[] = [
    {
      header: "No",
      className: "w-12 text-center text-slate-400 text-xs",
      headerClassName: "text-center",
      accessor: (_row: AtkRequestData, idx: number) => (page - 1) * 10 + idx + 1,
    },
    {
      header: "Karyawan",
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.user.name}</p>
          <p className="text-xs text-slate-400">{row.user.position}</p>
        </div>
      ),
    },
    {
      header: "Departemen",
      accessor: (row) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
          {row.user.department}
        </span>
      ),
    },
    {
      header: "Barang ATK",
      accessor: (row) => (
        <span className="font-medium text-slate-800">{row.atkItem.name}</span>
      ),
    },
    {
      header: "Jumlah",
      accessor: (row) => (
        <span className="font-semibold text-slate-900">
          {row.quantity} {row.atkItem.unit}
        </span>
      ),
    },
    {
      header: "Tanggal",
      accessor: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => <Badge status={row.status} />,
    },
    {
      header: "Aksi",
      className: "text-right",
      headerClassName: "text-right",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedRequest(row)}
          >
            Review
          </Button>
          <Link href={`/admin/pengajuan/${row.id}`}>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Manajemen Pengajuan ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola, setujui, tolak, dan proses seluruh permohonan pengadaan alat tulis kantor.
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <Card title="Filter & Pencarian Pengajuan">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Input
                label="Cari Data"
                placeholder="Nama karyawan, barang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            <div>
              <Select
                label="Status Pengajuan"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "MENUNGGU", label: "Menunggu Review" },
                  { value: "DISETUJUI", label: "Disetujui" },
                  { value: "DIPROSES", label: "Sedang Diproses" },
                  { value: "SELESAI", label: "Selesai" },
                  { value: "DITOLAK", label: "Ditolak" },
                ]}
              />
            </div>

            <div>
              <Select
                label="Departemen"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Departemen" },
                  ...departments.map((dept) => ({
                    value: dept,
                    label: dept,
                  })),
                ]}
              />
            </div>

            <div>
              <Input
                label="Mulai Tanggal"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <Input
                label="Sampai Tanggal"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {(search || statusFilter || departmentFilter || startDate || endDate) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-slate-500"
              >
                Reset Semua Filter
              </Button>
            </div>
          )}
        </Card>

        {/* Requests Table */}
        <Card noPadding>
          <Table
            columns={columns}
            data={requests}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => setPage(p)}
            emptyMessage="Tidak ada pengajuan yang sesuai dengan kriteria filter."
          />
        </Card>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Review Pengajuan ATK"
          subtitle={`ID: #${selectedRequest.id.slice(-8)} • Pemohon: ${selectedRequest.user.name}`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Tutup
              </Button>

              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">
                  Ubah Status:
                </span>

                {selectedRequest.status !== "MENUNGGU" && (
                  <Button
                    variant="secondary"
                    size="xs"
                    isLoading={isProcessing}
                    onClick={() =>
                      handleUpdateStatus(selectedRequest.id, "MENUNGGU")
                    }
                  >
                    🟡 Menunggu
                  </Button>
                )}

                {selectedRequest.status !== "DISETUJUI" && (
                  <Button
                    variant="success"
                    size="xs"
                    isLoading={isProcessing}
                    onClick={() =>
                      handleUpdateStatus(selectedRequest.id, "DISETUJUI")
                    }
                  >
                    ✓ Disetujui
                  </Button>
                )}

                {selectedRequest.status !== "DIPROSES" && (
                  <Button
                    variant="primary"
                    size="xs"
                    isLoading={isProcessing}
                    onClick={() =>
                      handleUpdateStatus(selectedRequest.id, "DIPROSES")
                    }
                  >
                    ⚙️ Diproses
                  </Button>
                )}

                {selectedRequest.status !== "SELESAI" && (
                  <Button
                    variant="success"
                    size="xs"
                    isLoading={isProcessing}
                    onClick={() =>
                      handleUpdateStatus(selectedRequest.id, "SELESAI")
                    }
                  >
                    🏁 Selesai
                  </Button>
                )}

                {selectedRequest.status !== "DITOLAK" && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setRejectModalOpen(true)}
                  >
                    ✕ Tolak
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status Saat Ini
              </span>
              <Badge status={selectedRequest.status} size="md" />
            </div>

            {/* Applicant details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Data Pemohon
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Nama</p>
                  <p className="font-semibold text-slate-900">
                    {selectedRequest.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Departemen</p>
                  <p className="font-semibold text-slate-900">
                    {selectedRequest.user.department}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Jabatan</p>
                  <p className="font-semibold text-slate-900">
                    {selectedRequest.user.position}
                  </p>
                </div>
              </div>
            </div>

            {/* Item & Quantity */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Barang ATK</p>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">
                  {selectedRequest.atkItem.name}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Jumlah Pengajuan</p>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">
                  {selectedRequest.quantity} {selectedRequest.atkItem.unit}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Waktu Pengajuan</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {new Date(selectedRequest.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Diproses Oleh</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedRequest.processor?.name || "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Alasan / Keperluan
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                {selectedRequest.reason}
              </div>
            </div>

            {selectedRequest.adminNote && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Catatan Admin
                </p>
                <p className="text-xs text-amber-900">
                  {selectedRequest.adminNote}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Tolak Pengajuan ATK"
          subtitle={`Pemohon: ${selectedRequest.user.name} • Barang: ${selectedRequest.atkItem.name}`}
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
                  handleUpdateStatus(
                    selectedRequest.id,
                    "DITOLAK",
                    rejectNote.trim()
                  );
                }}
              >
                Konfirmasi Tolak
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Mohon berikan alasan penolakan yang jelas agar pemohon memahami pertimbangan Admin.
            </p>
            <Textarea
              label="Alasan Penolakan"
              required
              rows={4}
              placeholder="Contoh: Stok sedang dialokasikan untuk kegiatan prioritas divisi..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
