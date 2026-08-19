"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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

export default function AdminPengajuanPembelianPage() {
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

  // Selection state for Bulk Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);
  const [adminNoteEdit, setAdminNoteEdit] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);


  // Delete Modals
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<AtkRequestData | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const fetchRequests = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        params.set("type", "purchase"); // Only purchase requests
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
        console.error("Fetch purchase requests error:", err);
        if (showLoading) toast.error("Gagal memuat data pengajuan pembelian");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [page, search, statusFilter, departmentFilter, startDate, endDate, toast]
  );

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  // Real-time auto refresh polling (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests(false);
    }, 5000);

    const handleFocus = () => {
      fetchRequests(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchRequests]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchRequests(false);
    await fetchDepartments();
    setIsRefreshing(false);
    toast.success("Data pengajuan pembelian berhasil diperbarui!");
  };

  // Open review modal and sync admin note
  const handleOpenReview = (request: AtkRequestData) => {
    setSelectedRequest(request);
    setAdminNoteEdit(request.adminNote || "");
  };

  // Update Status (Setujui, Tolak, Diproses, Selesai)
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
        body: JSON.stringify({ status, adminNote: adminNote ?? adminNoteEdit }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status pengajuan");
      }

      toast.success(
        status === "DISETUJUI"
          ? "Pengajuan pembelian berhasil disetujui!"
          : status === "DITOLAK"
          ? "Pengajuan pembelian berhasil ditolak."
          : `Status pengajuan berhasil diubah menjadi ${status}`
      );

      setSelectedRequest(null);
      setRejectModalOpen(false);
      setRejectNote("");
      fetchRequests(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengubah status");
    } finally {
      setIsProcessing(false);
    }
  };

  // Save admin note only
  const handleSaveAdminNote = async () => {
    if (!selectedRequest) return;
    try {
      setIsSavingNote(true);
      const res = await fetch(`/api/requests/${selectedRequest.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedRequest.status,
          adminNote: adminNoteEdit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan catatan admin");
      }

      toast.success("Catatan admin berhasil disimpan!");
      setSelectedRequest((prev) => (prev ? { ...prev, adminNote: adminNoteEdit } : null));
      fetchRequests(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan catatan");
    } finally {
      setIsSavingNote(false);
    }
  };

  // ─── SINGLE DELETE ───
  const handleDeleteSingle = async () => {
    if (!singleDeleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/requests/${singleDeleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus pengajuan");
      }

      toast.success("Data pengajuan pembelian berhasil dihapus");
      setSingleDeleteTarget(null);
      setSelectedRequest(null);
      setSelectedIds((prev) => prev.filter((id) => id !== singleDeleteTarget.id));
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── BULK DELETE ───
  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsDeleting(true);
      const res = await fetch("/api/requests/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus data terpilih");
      }

      toast.success(data.message || `${selectedIds.length} pengajuan berhasil dihapus`);
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus pengajuan");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── DELETE ALL ───
  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch("/api/requests/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus seluruh pengajuan");
      }

      toast.success(data.message || "Seluruh data pengajuan berhasil dibersihkan");
      setSelectedIds([]);
      setDeleteAllModalOpen(false);
      setPage(1);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Checkbox Selection Handlers ───
  const isAllCurrentPageSelected = useMemo(() => {
    if (requests.length === 0) return false;
    return requests.every((r) => selectedIds.includes(r.id));
  }, [requests, selectedIds]);

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = requests.map((r) => r.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = requests.map((r) => r.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDepartmentFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Clean reason text display
  const getCleanReason = (rawReason?: string) => {
    if (!rawReason) return "Tidak ada catatan";
    return rawReason
      .replace(/\[PENGAJUAN PEMBELIAN ATK BARU\]/g, "")
      .replace(/^Alasan:\s*/gm, "")
      .trim();
  };

  // ─── Columns Definition ───
  const columns: Column<AtkRequestData>[] = [
    {
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isAllCurrentPageSelected}
            onChange={handleToggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500]/30 cursor-pointer"
            title="Pilih Semua di Halaman Ini"
          />
        </div>
      ),
      className: "w-10 text-center",
      headerClassName: "w-10 text-center",
      accessor: (row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={() => handleToggleSelectRow(row.id)}
            className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500]/30 cursor-pointer"
          />
        </div>
      ),
    },
    {
      header: "No",
      className: "w-12 text-slate-400 text-xs",
      accessor: (_row, idx) => (page - 1) * 10 + idx + 1,
    },
    {
      header: "Karyawan Pemohon",
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
          {row.user.department}
        </span>
      ),
    },
    {
      header: "Nama Barang Pembelian",
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.atkItem.name}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
            {getCleanReason(row.reason)}
          </span>
        </div>
      ),
    },
    {
      header: "Jumlah",
      accessor: (row) => (
        <span className="font-bold text-[#FF5500] text-sm">
          {row.quantity} {row.atkItem.unit || "pcs"}
        </span>
      ),
    },
    {
      header: "Tanggal Pengajuan",
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
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="xs"
            onClick={() => handleOpenReview(row)}
          >
            Review & Proses
          </Button>

          {row.status === "MENUNGGU" && (
            <>
              <button
                type="button"
                onClick={() => handleUpdateStatus(row.id, "DISETUJUI")}
                title="Setujui Pembelian"
                className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
              >
                ✓ Setujui
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(row);
                  setRejectModalOpen(true);
                }}
                title="Tolak Pembelian"
                className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
              >
                ✕ Tolak
              </button>
            </>
          )}

          {/* Delete Single */}
          <button
            type="button"
            onClick={() => setSingleDeleteTarget(row)}
            title="Hapus Data Pengajuan"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer border border-transparent hover:border-rose-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Daftar Pengajuan Pembelian ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola, setujui, tolak, dan simpan seluruh data pengajuan pembelian barang alat tulis kantor.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              onClick={handleManualRefresh}
              className="text-slate-700 hover:text-[#FF5500] hover:border-orange-300 font-semibold"
              leftIcon={
                <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Refresh
            </Button>


            {/* Delete All */}
            <Button
              variant="outline"
              size="sm"
              disabled={total === 0}
              onClick={() => setDeleteAllModalOpen(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-semibold"
              leftIcon={
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Hapus Semua
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card title="Filter & Pencarian Pengajuan Pembelian">
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

        {/* ─── BULK ACTION TOOLBAR ─── */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-950">
              <span className="w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
                {selectedIds.length}
              </span>
              <span>Data pengajuan pembelian terpilih</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelectedIds([])}
                className="text-slate-600 hover:text-slate-900"
              >
                Batalkan Pilihan
              </Button>

              <Button
                variant="danger"
                size="xs"
                onClick={() => setBulkDeleteModalOpen(true)}
                leftIcon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                Hapus ({selectedIds.length}) Terpilih
              </Button>
            </div>
          </div>
        )}

        {/* Purchase Requests Table */}
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
            emptyMessage="Belum ada data pengajuan pembelian ATK yang sesuai."
          />
        </Card>
      </div>

      {/* ─── REVIEW & SIMPAN MODAL ─── */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Review Pengajuan Pembelian ATK"
          subtitle={`ID: #${selectedRequest.id.slice(-8)} • Pemohon: ${selectedRequest.user.name}`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  Tutup
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    const req = selectedRequest;
                    setSelectedRequest(null);
                    setSingleDeleteTarget(req);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">
                  Status:
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
                    ✓ Setujui
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
                Status Pengajuan
              </span>
              <Badge status={selectedRequest.status} size="md" />
            </div>

            {/* Applicant details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Data Pemohon (Karyawan)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Nama Lengkap</p>
                  <p className="font-semibold text-slate-900">
                    {selectedRequest.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Departemen / Divisi</p>
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

            {/* Item details */}
            <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200/70">
              <p className="text-[11px] font-bold text-[#FF5500] uppercase tracking-wider mb-2">
                Detail Barang Pembelian yang Diajukan
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <p className="text-slate-400 font-medium">Nama Barang ATK</p>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedRequest.atkItem.name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Jumlah Pembelian</p>
                  <p className="font-bold text-[#FF5500] text-sm">
                    {selectedRequest.quantity} {selectedRequest.atkItem.unit || "pcs"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alasan / Keperluan Pembelian
              </p>
              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed whitespace-pre-line">
                {getCleanReason(selectedRequest.reason)}
              </p>
            </div>

            {/* Admin Note - Editable & Savable */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Catatan / Keterangan Admin
                </label>
                <Button
                  variant="outline"
                  size="xs"
                  isLoading={isSavingNote}
                  onClick={handleSaveAdminNote}
                  className="text-xs text-[#FF5500] border-orange-200 hover:bg-orange-50 font-bold"
                >
                  💾 Simpan Catatan
                </Button>
              </div>
              <Textarea
                rows={3}
                placeholder="Tuliskan catatan persetujuan, vendor, estimasi biaya, atau keterangan lainnya..."
                value={adminNoteEdit}
                onChange={(e) => setAdminNoteEdit(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}


      {/* ─── REJECT MODAL ─── */}
      {rejectModalOpen && selectedRequest && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setRejectNote("");
          }}
          title="Tolak Pengajuan Pembelian ATK"
          subtitle={`Pengajuan #${selectedRequest.id.slice(-8)} oleh ${selectedRequest.user.name}`}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectNote("");
                }}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isProcessing}
                onClick={() =>
                  handleUpdateStatus(
                    selectedRequest.id,
                    "DITOLAK",
                    rejectNote.trim() || "Pengajuan pembelian ditolak oleh Admin."
                  )
                }
              >
                Tolak Pengajuan
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menolak pengajuan pembelian <b>{selectedRequest.atkItem.name}</b> dari <b>{selectedRequest.user.name}</b>?
            </p>
            <Textarea
              label="Alasan Penolakan (Wajib)"
              placeholder="Contoh: Anggaran belum tersedia / Barang serupa masih cukup..."
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              required
            />
          </div>
        </Modal>
      )}

      {/* ─── SINGLE DELETE CONFIRM MODAL ─── */}
      {singleDeleteTarget && (
        <Modal
          isOpen={!!singleDeleteTarget}
          onClose={() => setSingleDeleteTarget(null)}
          title="Hapus Data Pengajuan Pembelian"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSingleDeleteTarget(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteSingle}
              >
                Ya, Hapus Data
              </Button>
            </div>
          }
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus data pengajuan pembelian <b>{singleDeleteTarget.atkItem.name}</b> oleh <b>{singleDeleteTarget.user.name}</b>? Tindakan ini tidak dapat dibatalkan.
          </p>
        </Modal>
      )}

      {/* ─── BULK DELETE MODAL ─── */}
      {bulkDeleteModalOpen && (
        <Modal
          isOpen={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          title={`Hapus ${selectedIds.length} Pengajuan Terpilih`}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteBulk}
              >
                Ya, Hapus ({selectedIds.length}) Data
              </Button>
            </div>
          }
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Anda akan menghapus <b>{selectedIds.length} data pengajuan pembelian terpilih</b>. Tindakan ini permanen.
          </p>
        </Modal>
      )}

      {/* ─── DELETE ALL MODAL ─── */}
      {deleteAllModalOpen && (
        <Modal
          isOpen={deleteAllModalOpen}
          onClose={() => setDeleteAllModalOpen(false)}
          title="Hapus Seluruh Data Pengajuan"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteAllModalOpen(false)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteAll}
              >
                Ya, Bersihkan Seluruh Data
              </Button>
            </div>
          }
        >
          <div className="space-y-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
            <p className="font-bold">⚠️ Perhatian!</p>
            <p className="text-slate-700">
              Tindakan ini akan menghapus <b>seluruh riwayat pengajuan</b> dari database. Data yang dihapus tidak dapat dipulihkan kembali.
            </p>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
