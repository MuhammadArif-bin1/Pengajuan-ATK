"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [dateMode, setDateMode] = useState<"all" | "today" | "date" | "month" | "year" | "range">("all");
  const [specificDate, setSpecificDate] = useState("");
  const [specificMonth, setSpecificMonth] = useState("");
  const [specificYear, setSpecificYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selection state for Bulk Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete Modals
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<AtkRequestData | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

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
        params.set("type", "regular");
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
          setLastRefreshed(new Date());
        }
      } catch (err) {
        console.error("Fetch requests error:", err);
        if (showLoading) toast.error("Gagal memuat daftar pengajuan");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [page, search, statusFilter, departmentFilter, startDate, endDate, toast]
  );

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Initial load
  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  // Real-time auto refresh polling (every 5 seconds & on window focus)
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
    toast.success("Data pengajuan berhasil diperbarui!");
  };

  // Status update
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
        throw new Error(data.error || "Gagal mengubah status pengajuan");
      }

      toast.success(data.message || `Status pengajuan berhasil diubah menjadi ${status}`);
      setSelectedRequest(null);
      setRejectModalOpen(false);
      setRejectNote("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengubah status");
    } finally {
      setIsProcessing(false);
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

      toast.success("Pengajuan berhasil dihapus");
      setSingleDeleteTarget(null);
      setSelectedRequest(null);
      // Remove from selectedIds if present
      setSelectedIds((prev) => prev.filter((id) => id !== singleDeleteTarget.id));
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── BULK DELETE (Selected Items) ───
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

  // ─── DELETE ALL (Clear All Records) ───
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
      // Unselect all on current page
      const pageIds = requests.map((r) => r.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      // Select all on current page
      const pageIds = requests.map((r) => r.id);
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(combined);
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
    setDateMode("all");
    setSpecificDate("");
    setSpecificMonth("");
    setSpecificYear("");
    setStartDate("");
    setEndDate("");
    setPage(1);
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
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
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedRequest(row)}
          >
            Review
          </Button>

          {/* Delete Single Button */}
          <button
            type="button"
            onClick={() => setSingleDeleteTarget(row)}
            title="Hapus Pengajuan Ini"
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
              Manajemen Pengajuan ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola, setujui, tolak, dan bersihkan permohonan pengadaan alat tulis kantor.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
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
              Refresh Data
            </Button>

            {/* Delete All Button */}
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
              Hapus Semua Pengajuan
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card title="Filter & Pencarian Pengajuan">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <Select
                label="Filter Waktu / Tanggal"
                value={dateMode}
                onChange={(e) => {
                  const mode = e.target.value as "all" | "today" | "date" | "month" | "year" | "range";
                  setDateMode(mode);
                  setPage(1);
                  if (mode === "all") {
                    setStartDate("");
                    setEndDate("");
                    setSpecificDate("");
                    setSpecificMonth("");
                    setSpecificYear("");
                  } else if (mode === "today") {
                    const today = new Date().toISOString().split("T")[0];
                    setStartDate(today);
                    setEndDate(today);
                  }
                }}
                options={[
                  { value: "all", label: "Semua Waktu (Default)" },
                  { value: "today", label: "Hari Ini" },
                  { value: "date", label: "Per Tanggal Tertentu" },
                  { value: "month", label: "Per Bulan" },
                  { value: "year", label: "Per Tahun" },
                  { value: "range", label: "Rentang Tanggal Khusus" },
                ]}
              />
            </div>
          </div>

          {/* Conditional Sub-row for Date Picker Selection */}
          {dateMode !== "all" && dateMode !== "today" && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
              {dateMode === "date" && (
                <div className="w-full sm:w-64">
                  <Input
                    label="Pilih Tanggal Pengajuan"
                    type="date"
                    value={specificDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSpecificDate(val);
                      setStartDate(val);
                      setEndDate(val);
                      setPage(1);
                    }}
                  />
                </div>
              )}

              {dateMode === "month" && (
                <div className="w-full sm:w-64">
                  <Input
                    label="Pilih Bulan & Tahun"
                    type="month"
                    value={specificMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSpecificMonth(val);
                      if (val) {
                        const [y, m] = val.split("-").map(Number);
                        const lastDay = new Date(y, m, 0).getDate();
                        setStartDate(`${val}-01`);
                        setEndDate(`${val}-${String(lastDay).padStart(2, "0")}`);
                      } else {
                        setStartDate("");
                        setEndDate("");
                      }
                      setPage(1);
                    }}
                  />
                </div>
              )}

              {dateMode === "year" && (
                <div className="w-full sm:w-64">
                  <Select
                    label="Pilih Tahun Pengajuan"
                    value={specificYear}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSpecificYear(val);
                      if (val) {
                        setStartDate(`${val}-01-01`);
                        setEndDate(`${val}-12-31`);
                      } else {
                        setStartDate("");
                        setEndDate("");
                      }
                      setPage(1);
                    }}
                    options={[
                      { value: "", label: "-- Pilih Tahun --" },
                      { value: "2024", label: "Tahun 2024" },
                      { value: "2025", label: "Tahun 2025" },
                      { value: "2026", label: "Tahun 2026" },
                      { value: "2027", label: "Tahun 2027" },
                      { value: "2028", label: "Tahun 2028" },
                    ]}
                  />
                </div>
              )}

              {dateMode === "range" && (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="w-full sm:w-56">
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
                  <div className="w-full sm:w-56">
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
              )}
            </div>
          )}

          {(search || statusFilter || departmentFilter || dateMode !== "all" || startDate || endDate) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Reset Semua Filter
              </Button>
            </div>
          )}
        </Card>

        {/* ─── BULK ACTION TOOLBAR (When items are selected) ─── */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-950">
              <span className="w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
                {selectedIds.length}
              </span>
              <span>Data pengajuan terpilih</span>
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
                Hapus ({selectedIds.length}) Data Terpilih
              </Button>
            </div>
          </div>
        )}

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

      {/* ─── REVIEW MODAL ─── */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Review Pengajuan ATK"
          subtitle={`Tiket: #${selectedRequest.id.slice(-8).toUpperCase()} • Pemohon: ${selectedRequest.user.name}`}
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

                {/* Delete Button inside Review Modal */}
                <button
                  type="button"
                  onClick={() => {
                    const req = selectedRequest;
                    setSelectedRequest(null);
                    setSingleDeleteTarget(req);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Hapus Pengajuan</span>
                </button>
              </div>

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
          <div className="space-y-4">
            {/* ─── STATUS HEADER BAR ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Permohonan:</span>
                <Badge status={selectedRequest.status} size="md" />
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
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF5500] flex items-center justify-center text-xs font-bold">
                  👤
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Data Pemohon (Karyawan)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Nama Lengkap</p>
                  <p className="text-xs font-bold text-slate-900">{selectedRequest.user.name}</p>
                </div>
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Departemen / Divisi</p>
                  <p className="text-xs font-bold text-slate-900">{selectedRequest.user.department}</p>
                </div>
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Jabatan</p>
                  <p className="text-xs font-bold text-slate-900">{selectedRequest.user.position}</p>
                </div>
              </div>
            </div>

            {/* ─── 2. DETAIL BARANG YANG DIAJUKAN CARD ─── */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    📦
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Barang yang Diajukan
                  </h4>
                </div>
                {selectedRequest.atkItem.stock !== undefined && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Sisa Stok: {selectedRequest.atkItem.stock} {selectedRequest.atkItem.unit}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-lg shrink-0">
                    📝
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{selectedRequest.atkItem.name}</p>
                    <p className="text-[11px] font-medium text-slate-500">Satuan: {selectedRequest.atkItem.unit || "Unit"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-xs text-slate-500 font-semibold">Jumlah Permohonan:</span>
                  <span className="px-3 py-1 bg-white text-slate-900 font-extrabold text-xs rounded-lg border border-slate-200 shadow-2xs">
                    {selectedRequest.quantity} {selectedRequest.atkItem.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── 3. ALASAN & KEPERLUAN CARD ─── */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  💬
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Alasan & Keperluan Pengguna
                </h4>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed font-medium">
                {selectedRequest.reason && selectedRequest.reason.trim() ? (
                  <p className="whitespace-pre-line">{selectedRequest.reason}</p>
                ) : (
                  <p className="text-slate-400 italic">Tidak ada catatan atau alasan spesifik.</p>
                )}
              </div>
            </div>

            {/* ─── 4. CATATAN / REVIEW ADMIN (JIKA ADA) ─── */}
            {(selectedRequest.adminNote || selectedRequest.processedAt) && (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 shadow-2xs">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-200/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                      Informasi Pemrosesan Administrator
                    </h4>
                  </div>
                  {selectedRequest.processedAt && (
                    <span className="text-[10px] font-semibold text-amber-700">
                      {new Date(selectedRequest.processedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {selectedRequest.adminNote && (
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 text-xs text-amber-950 font-medium">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-0.5">Catatan Administrator:</p>
                    <p className="whitespace-pre-line">{selectedRequest.adminNote}</p>
                  </div>
                )}
              </div>
            )}
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
          title="Tolak Pengajuan ATK"
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
                    rejectNote || undefined
                  )
                }
              >
                Konfirmasi Tolak
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menolak pengajuan ini? Berikan catatan alasan penolakan untuk pemohon.
            </p>
            <Textarea
              label="Alasan Penolakan (Opsional)"
              placeholder="Contoh: Stok tidak mencukupi, silakan ajukan ulang minggu depan..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {/* ─── 1. MODAL: DELETE SINGLE REQUEST ─── */}
      {singleDeleteTarget && (
        <Modal
          isOpen={!!singleDeleteTarget}
          onClose={() => setSingleDeleteTarget(null)}
          title="Hapus Pengajuan ATK"
          subtitle={`Konfirmasi Penghapusan Data`}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setSingleDeleteTarget(null)}
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
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold">Hapus Pengajuan Ini?</p>
                <p className="mt-0.5">
                  Pengajuan barang <b>{singleDeleteTarget.atkItem?.name}</b> ({singleDeleteTarget.quantity} {singleDeleteTarget.atkItem?.unit}) atas nama <b>{singleDeleteTarget.user?.name}</b> ({singleDeleteTarget.user?.department}) akan dihapus secara permanen dari sistem.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── 2. MODAL: BULK DELETE SELECTED REQUESTS ─── */}
      {bulkDeleteModalOpen && (
        <Modal
          isOpen={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          title="Hapus Pengajuan Terpilih"
          subtitle={`Konfirmasi Penghapusan Massal`}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setBulkDeleteModalOpen(false)}
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
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold">Hapus {selectedIds.length} Pengajuan Sekaligus?</p>
                <p className="mt-0.5">
                  Sebanyak <b>{selectedIds.length} data pengajuan</b> yang Anda pilih akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── 3. MODAL: DELETE ALL REQUESTS ─── */}
      {deleteAllModalOpen && (
        <Modal
          isOpen={deleteAllModalOpen}
          onClose={() => setDeleteAllModalOpen(false)}
          title="Hapus SEMUA Data Pengajuan"
          subtitle="Peringatan Pembersihan Seluruh Database Pengajuan"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteAllModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteAll}
              >
                Ya, Bersihkan Semua Data ({total})
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-100 border border-red-300 rounded-xl text-red-900 text-xs">
              <svg className="w-6 h-6 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-extrabold text-red-950 uppercase tracking-wide">Peringatan Penting!</p>
                <p className="mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <b>SELURUH ({total}) data pengajuan ATK</b> di sistem? Semua riwayat pengajuan akan dibersihkan secara permanen.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
