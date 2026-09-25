"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { exportReportToCsv, exportReportToExcel } from "@/lib/exportExcel";
import { isPurchaseRequest, cleanPurchaseReason } from "@/lib/requestHelpers";

interface ReportSummary {
  total: number;
  byDepartment: Record<
    string,
    {
      total: number;
      diproses?: number;
      selesai?: number;
      ditolak?: number;
      approved?: number;
      inProgress?: number;
      rejected?: number;
    }
  >;
  byItem: Record<string, { total: number; quantity: number; unit?: string }>;
}

export default function AdminLaporanPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [reportData, setReportData] = useState<{
    requests: any[];
    summary: ReportSummary;
  }>({
    requests: [],
    summary: { total: 0, byDepartment: {}, byItem: {} },
  });

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "regular" | "purchase">("");
  const [departments, setDepartments] = useState<string[]>([]);

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

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (department) params.set("department", department);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/requests/report?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        toast.error("Gagal mengambil data laporan");
      }
    } catch (err) {
      console.error("Fetch report error:", err);
      toast.error("Terjadi kesalahan koneksi server");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, department, typeFilter, toast]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Safe background auto-refresh every 15s (only when tab is visible) + on window focus & visibilitychange
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchReport();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchReport();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [fetchReport]);

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setDepartment("");
    setTypeFilter("");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (reportData.requests.length === 0) {
      toast.error("Tidak ada data transaksi untuk diekspor");
      return;
    }

    try {
      setIsExporting(true);

      const departmentSummary = Object.entries(reportData.summary.byDepartment).map(
        ([dept, val]) => ({
          department: dept,
          total: val.total,
          diproses: val.diproses ?? val.inProgress ?? 0,
          selesai: val.selesai ?? val.approved ?? 0,
          ditolak: val.ditolak ?? val.rejected ?? 0,
          approved: val.selesai ?? val.approved ?? 0,
          inProgress: val.diproses ?? val.inProgress ?? 0,
          rejected: val.ditolak ?? val.rejected ?? 0,
        })
      );

      const itemSummary = Object.entries(reportData.summary.byItem).map(
        ([name, val]) => ({
          name,
          total: val.total,
          quantity: val.quantity,
          unit: val.unit || "pcs",
        })
      );

      exportReportToCsv({
        transactions: reportData.requests,
        departmentSummary,
        itemSummary,
        filterInfo: {
          startDate,
          endDate,
          department,
          type: typeFilter,
        },
      });

      toast.success("File CSV laporan berhasil diunduh!");
    } catch (err: any) {
      console.error("CSV export error:", err);
      toast.error("Gagal mengekspor file CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportData || reportData.requests.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      setIsExportingExcel(true);

      const departmentSummary = Object.entries(reportData.summary.byDepartment).map(
        ([dept, val]) => ({
          department: dept,
          total: val.total,
          diproses: val.diproses ?? val.inProgress ?? 0,
          selesai: val.selesai ?? val.approved ?? 0,
          ditolak: val.ditolak ?? val.rejected ?? 0,
          approved: val.selesai ?? val.approved ?? 0,
          inProgress: val.diproses ?? val.inProgress ?? 0,
          rejected: val.ditolak ?? val.rejected ?? 0,
        })
      );

      const itemSummary = Object.entries(reportData.summary.byItem).map(
        ([name, val]) => ({
          name,
          total: val.total,
          quantity: val.quantity,
          unit: val.unit || "pcs",
        })
      );

      await exportReportToExcel({
        transactions: reportData.requests,
        departmentSummary,
        itemSummary,
        filterInfo: {
          startDate,
          endDate,
          department,
          type: typeFilter,
        },
      });

      toast.success("File Excel (.xlsx) laporan berhasil diunduh!");
    } catch (err: any) {
      console.error("Excel export error:", err);
      toast.error("Gagal mengekspor file Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const departmentRows = useMemo(() => {
    return Object.entries(reportData.summary.byDepartment).map(([dept, val]) => ({
      department: dept,
      total: val.total,
      diproses: val.diproses ?? val.inProgress ?? 0,
      selesai: val.selesai ?? val.approved ?? 0,
      ditolak: val.ditolak ?? val.rejected ?? 0,
      approved: val.selesai ?? val.approved ?? 0,
      rejected: val.ditolak ?? val.rejected ?? 0,
    }));
  }, [reportData.summary.byDepartment]);

  const itemRows = useMemo(() => {
    return Object.entries(reportData.summary.byItem).map(([name, val]) => ({
      name,
      total: val.total,
      quantity: val.quantity,
      unit: val.unit || "pcs",
    }));
  }, [reportData.summary.byItem]);

  const totalSelesai = useMemo(() => {
    return departmentRows.reduce((acc, curr) => acc + curr.selesai, 0);
  }, [departmentRows]);

  const getCleanReason = cleanPurchaseReason;

  const isFiltered = Boolean(startDate || endDate || department || typeFilter);

  return (
    <AdminLayout>
      <div className="space-y-6 print:p-0">
        {/* ─── FILTER & PARAMETER PANEL ─── */}
        <div className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-5 space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#ebeef2]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#323c4d] uppercase tracking-wider">
              <svg className="w-4 h-4 text-[#ff8f00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Parameter & Filter Laporan</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-xs font-bold text-[#606c80] hover:text-[#323c4d] px-2.5 py-1.5 rounded-[8px] hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                >
                  <span>✕ Reset Filter</span>
                </button>
              )}

              {/* Action Buttons: Ekspor Excel, Ekspor CSV & Cetak Laporan */}
              <button
                type="button"
                disabled={isExportingExcel || reportData.requests.length === 0}
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-[8px] bg-[#01923f] hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{isExportingExcel ? "Menyiapkan Excel..." : "Ekspor Excel"}</span>
              </button>

              <button
                type="button"
                disabled={isExporting || reportData.requests.length === 0}
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-[8px] border border-[#ebeef2] bg-white hover:bg-slate-50 text-xs font-bold text-[#323c4d] transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5 text-[#606c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{isExporting ? "Menyiapkan CSV..." : "Ekspor CSV"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-[8px] border border-[#ebeef2] bg-white hover:bg-slate-50 text-xs font-bold text-[#323c4d] transition shadow-2xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-[#606c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Filter Kategori */}
            <div>
              <label className="block text-[11px] font-semibold text-[#606c80] uppercase tracking-wider mb-1.5">
                Kategori Pengajuan
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "" | "regular" | "purchase")}
                className="w-full rounded-[8px] border border-[#ebeef2] bg-white px-3 py-2 text-xs font-semibold text-[#323c4d] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/25 focus:border-[#ff8f00] transition"
              >
                <option value="">Semua Kategori (Semua Pengajuan)</option>
                <option value="regular">Permintaan ATK Gudang Saja</option>
                <option value="purchase">Pengajuan Pembelian ATK Saja</option>
              </select>
            </div>

            {/* Filter Departemen */}
            <div>
              <label className="block text-[11px] font-semibold text-[#606c80] uppercase tracking-wider mb-1.5">
                Departemen / Divisi
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-[8px] border border-[#ebeef2] bg-white px-3 py-2 text-xs font-semibold text-[#323c4d] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/25 focus:border-[#ff8f00] transition"
              >
                <option value="">Semua Departemen</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal Mulai */}
            <div>
              <label className="block text-[11px] font-semibold text-[#606c80] uppercase tracking-wider mb-1.5">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-[8px] border border-[#ebeef2] bg-white px-3 py-2 text-xs font-semibold text-[#323c4d] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/25 focus:border-[#ff8f00] transition"
              />
            </div>

            {/* Filter Tanggal Akhir */}
            <div>
              <label className="block text-[11px] font-semibold text-[#606c80] uppercase tracking-wider mb-1.5">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-[8px] border border-[#ebeef2] bg-white px-3 py-2 text-xs font-semibold text-[#323c4d] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/25 focus:border-[#ff8f00] transition"
              />
            </div>
          </div>
        </div>

        {/* ─── SUMMARY STATISTIC CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Transaksi */}
          <div className="bg-white p-4 sm:p-5 rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider">
                Total Berkas Masuk
              </span>
              <p className="text-2xl font-bold text-[#323c4d] tracking-tight">
                {reportData.summary.total}
              </p>
              <span className="text-[11px] text-[#606c80] block">
                Transaksi pengajuan
              </span>
            </div>
            <div className="w-10 h-10 rounded-[8px] bg-orange-50 text-[#ff8f00] border border-orange-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Card 2: Departemen */}
          <div className="bg-white p-4 sm:p-5 rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider">
                Departemen Pemohon
              </span>
              <p className="text-2xl font-bold text-[#323c4d] tracking-tight">
                {departmentRows.length}
              </p>
              <span className="text-[11px] text-[#606c80] block">
                Divisi terdaftar
              </span>
            </div>
            <div className="w-10 h-10 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          {/* Card 3: Variasi Barang */}
          <div className="bg-white p-4 sm:p-5 rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider">
                Jenis Barang Digunakan
              </span>
              <p className="text-2xl font-bold text-[#323c4d] tracking-tight">
                {itemRows.length}
              </p>
              <span className="text-[11px] text-[#606c80] block">
                Item ATK terdata
              </span>
            </div>
            <div className="w-10 h-10 rounded-[8px] bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>

          {/* Card 4: Total Selesai */}
          <div className="bg-white p-4 sm:p-5 rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#606c80] uppercase tracking-wider">
                Total Selesai
              </span>
              <p className="text-2xl font-bold text-[#01923f] tracking-tight">
                {totalSelesai}
              </p>
              <span className="text-[11px] text-[#606c80] block">
                Pengajuan terselesaikan
              </span>
            </div>
            <div className="w-10 h-10 rounded-[8px] bg-emerald-50 text-[#01923f] border border-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* ─── RECAPITULATION TABLES GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: Rekapitulasi per Departemen */}
          <div className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ebeef2] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#323c4d]">
                  Rekapitulasi per Departemen
                </h3>
                <p className="text-[11px] text-[#606c80] mt-0.5">
                  Distribusi permohonan ATK berdasarkan divisi kerja
                </p>
              </div>
              <span className="text-[11px] font-bold bg-slate-100 text-[#606c80] px-2.5 py-1 rounded-[6px] border border-slate-200/60">
                {departmentRows.length} Divisi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-[#ebeef2] text-[#606c80] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Departemen</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Diproses</th>
                    <th className="px-4 py-3 text-center">Selesai</th>
                    <th className="px-4 py-3 text-center">Ditolak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef2]">
                  {departmentRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#606c80]">
                        Tidak ada data pada parameter filter ini.
                      </td>
                    </tr>
                  ) : (
                    departmentRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#323c4d]">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>{r.department}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-[6px] bg-slate-100 text-[#323c4d] font-bold text-[11px] border border-slate-200/60">
                            {r.total}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-[6px] bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                            {r.diproses}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-[6px] bg-emerald-50 text-[#01923f] border border-emerald-200 font-bold text-[11px]">
                            {r.selesai}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-[6px] bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                            {r.ditolak}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Top Barang ATK */}
          <div className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ebeef2] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#323c4d]">
                  Top Barang ATK Paling Sering Diajukan
                </h3>
                <p className="text-[11px] text-[#606c80] mt-0.5">
                  Akumulasi kuantitas barang yang paling banyak dibutuhkan
                </p>
              </div>
              <span className="text-[11px] font-bold bg-slate-100 text-[#606c80] px-2.5 py-1 rounded-[6px] border border-slate-200/60">
                {itemRows.length} Item
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-[#ebeef2] text-[#606c80] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">#</th>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3 text-center">Frekuensi</th>
                    <th className="px-4 py-3 text-right">Total Kuantitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef2]">
                  {itemRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#606c80]">
                        Tidak ada data pada parameter filter ini.
                      </td>
                    </tr>
                  ) : (
                    itemRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 text-center text-[#606c80] font-bold">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#323c4d]">
                          {r.name}
                        </td>
                        <td className="px-4 py-3.5 text-center text-[#606c80] font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border border-slate-200/60">
                            {r.total} kali
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-[#323c4d] text-xs">
                          {r.quantity} <span className="text-[#606c80] font-normal text-[11px]">{r.unit}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── DETAILED TRANSACTIONS TABLE ─── */}
        <div className="bg-white rounded-[10px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ebeef2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#323c4d]">
                Rincian Transaksi Pengajuan ATK
              </h3>
              <p className="text-[11px] text-[#606c80] mt-0.5">
                Daftar lengkap seluruh berkas permohonan ({reportData.requests.length} data)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-[#ebeef2] text-[#606c80] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">No</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Pemohon</th>
                  <th className="px-4 py-3">Departemen</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Barang ATK</th>
                  <th className="px-4 py-3 text-center">Jumlah</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebeef2]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#606c80]">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-[#ff8f00]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="font-semibold text-xs text-[#323c4d]">Memuat data laporan...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData.requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[#606c80]">
                      Tidak ada transaksi pengajuan pada parameter filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  reportData.requests.map((row, idx) => {
                    const isPurchase = isPurchaseRequest(row.reason);

                    const cleanReason = getCleanReason(row.reason);

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 text-center text-[#606c80] font-semibold">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[#606c80]">
                          {new Date(row.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#323c4d] block">
                            {row.user?.name || "-"}
                          </span>
                          {row.user?.position && (
                            <span className="text-[11px] text-[#606c80] block">
                              {row.user.position}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold text-[#606c80] bg-slate-100 px-2 py-0.5 rounded-[6px] border border-slate-200/60 inline-block">
                            {row.user?.department || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] uppercase tracking-wider inline-block ${
                              isPurchase
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-orange-50 text-[#ff8f00] border border-orange-200"
                            }`}
                          >
                            {isPurchase ? "Pembelian" : "Permintaan"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#323c4d] block">
                            {row.atkItem?.name || "-"}
                          </span>
                          {cleanReason !== "-" && (
                            <span className="text-[11px] text-[#606c80] italic block line-clamp-1">
                              "{cleanReason}"
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap font-bold text-[#323c4d]">
                          {row.quantity} <span className="text-[11px] font-normal text-[#606c80]">{row.atkItem?.unit || "pcs"}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge status={row.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
