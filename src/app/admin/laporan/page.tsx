"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { exportReportToCsv } from "@/lib/exportExcel";

interface ReportSummary {
  total: number;
  byDepartment: Record<
    string,
    { total: number; approved: number; inProgress?: number; rejected: number }
  >;
  byItem: Record<string, { total: number; quantity: number; unit?: string }>;
}

export default function AdminLaporanPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
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
          approved: val.approved,
          inProgress: val.inProgress || 0,
          rejected: val.rejected,
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

  const departmentRows = useMemo(() => {
    return Object.entries(reportData.summary.byDepartment).map(([dept, val]) => ({
      department: dept,
      total: val.total,
      approved: val.approved,
      rejected: val.rejected,
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

  const totalApproved = useMemo(() => {
    return departmentRows.reduce((acc, curr) => acc + curr.approved, 0);
  }, [departmentRows]);

  const getCleanReason = (reason: string) => {
    if (!reason) return "-";
    let clean = reason
      .replace("[PENGAJUAN PEMBELIAN ATK BARU]", "")
      .replace("[PERMINTAAN ATK]", "")
      .trim();
    if (clean.startsWith("Alasan:")) {
      clean = clean.replace(/^Alasan:\s*/, "").trim();
    }
    return clean || "-";
  };

  const isFiltered = Boolean(startDate || endDate || department || typeFilter);

  return (
    <AdminLayout>
      <div className="space-y-6 print:p-0">
        {/* ─── PAGE HEADER & ACTIONS ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Laporan & Analisis Pengajuan ATK
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Rekapitulasi berkas permohonan dan pengadaan barang ATK terstruktur berdasarkan divisi dan periode waktu.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 print:hidden shrink-0">
            <button
              type="button"
              disabled={isExporting || reportData.requests.length === 0}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isExporting ? "Menyiapkan CSV..." : "Ekspor ke CSV (.csv)"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold shadow-2xs hover:border-slate-400 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* ─── FILTER & PARAMETER PANEL ─── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <svg className="w-4 h-4 text-[#FF5500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Parameter & Filter Laporan</span>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs font-bold text-[#FF5500] hover:text-[#E04B00] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>✕ Reset Filter</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Filter Kategori */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Kategori Pengajuan
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "" | "regular" | "purchase")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/25 focus:border-[#FF5500] transition"
              >
                <option value="">Semua Kategori (Semua Pengajuan)</option>
                <option value="regular">Permintaan ATK Gudang Saja</option>
                <option value="purchase">Pengajuan Pembelian ATK Saja</option>
              </select>
            </div>

            {/* Filter Departemen */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Departemen / Divisi
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/25 focus:border-[#FF5500] transition"
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
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/25 focus:border-[#FF5500] transition"
              />
            </div>

            {/* Filter Tanggal Akhir */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/25 focus:border-[#FF5500] transition"
              />
            </div>
          </div>
        </div>

        {/* ─── SUMMARY STATISTIC CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Transaksi */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Berkas Masuk
              </span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {reportData.summary.total}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block">
                Transaksi pengajuan
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF5500] border border-orange-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Card 2: Departemen */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Departemen Pemohon
              </span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {departmentRows.length}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block">
                Divisi terdaftar
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          {/* Card 3: Variasi Barang */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Jenis Barang Digunakan
              </span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {itemRows.length}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block">
                Item ATK terdata
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>

          {/* Card 4: Disetujui / Selesai */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Disetujui / Selesai
              </span>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {totalApproved}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block">
                Pengajuan terselesaikan
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* ─── RECAPITULATION TABLES GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: Rekapitulasi per Departemen */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi per Departemen
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Distribusi permohonan ATK berdasarkan divisi kerja
                </p>
              </div>
              <span className="text-[11px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                {departmentRows.length} Divisi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Departemen</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Disetujui</th>
                    <th className="px-4 py-3 text-center">Ditolak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data pada parameter filter ini.
                      </td>
                    </tr>
                  ) : (
                    departmentRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>{r.department}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                            {r.total}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px]">
                            {r.approved}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px]">
                            {r.rejected}
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
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Top Barang ATK Paling Sering Diajukan
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Akumulasi kuantitas barang yang paling banyak dibutuhkan
                </p>
              </div>
              <span className="text-[11px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                {itemRows.length} Item
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">#</th>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3 text-center">Frekuensi</th>
                    <th className="px-4 py-3 text-right">Total Kuantitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data pada parameter filter ini.
                      </td>
                    </tr>
                  ) : (
                    itemRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 text-center text-slate-400 font-bold">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {r.name}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {r.total} kali
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-[#FF5500] text-xs">
                          {r.quantity} <span className="text-slate-500 font-semibold text-[11px]">{r.unit}</span>
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rincian Transaksi Pengajuan ATK
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Daftar lengkap seluruh berkas permohonan ({reportData.requests.length} data)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-[#FF5500]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="font-semibold">Memuat data laporan...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData.requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada transaksi pengajuan pada parameter filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  reportData.requests.map((row, idx) => {
                    const isPurchase =
                      row.reason &&
                      row.reason.includes("[PENGAJUAN PEMBELIAN ATK BARU]");

                    const cleanReason = getCleanReason(row.reason);

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 text-center text-slate-400 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                          {new Date(row.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">
                            {row.user?.name || "-"}
                          </span>
                          {row.user?.position && (
                            <span className="text-[11px] text-slate-500 block">
                              {row.user.position}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 inline-block">
                            {row.user?.department || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider inline-block ${
                              isPurchase
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-orange-50 text-[#FF5500] border border-orange-200"
                            }`}
                          >
                            {isPurchase ? "Pembelian" : "Permintaan"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">
                            {row.atkItem?.name || "-"}
                          </span>
                          {cleanReason !== "-" && (
                            <span className="text-[11px] text-slate-500 italic block line-clamp-1">
                              "{cleanReason}"
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap font-black text-[#FF5500]">
                          {row.quantity} <span className="text-[11px] font-semibold text-slate-500">{row.atkItem?.unit || "pcs"}</span>
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
