"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, Column } from "@/components/ui/Table";
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

      toast.success("File CSV berhasil diunduh!");
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

  const transactionColumns: Column<any>[] = [
    {
      header: "No",
      className: "w-12 text-center text-xs text-slate-400 font-semibold",
      accessor: (_row: any, idx: number) => idx + 1,
    },
    {
      header: "Karyawan & Posisi",
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.user.name}
          </span>
          {row.user.position && (
            <span className="text-[11px] text-slate-500 block">
              {row.user.position}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Departemen",
      accessor: (row) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
          {row.user.department}
        </span>
      ),
    },
    {
      header: "Jenis",
      accessor: (row) => {
        const isPurchase =
          row.reason && row.reason.includes("[PENGAJUAN PEMBELIAN ATK BARU]");
        return (
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
              isPurchase
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : "bg-orange-50 text-[#FF5500] border border-orange-200"
            }`}
          >
            {isPurchase ? "Pembelian" : "Permintaan"}
          </span>
        );
      },
    },
    {
      header: "Barang ATK",
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.atkItem.name}
          </span>
          {row.reason && (
            <span className="text-[11px] text-slate-500 italic block line-clamp-1">
              "{getCleanReason(row.reason)}"
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Jumlah",
      accessor: (row) => (
        <span className="font-extrabold text-[#FF5500] text-xs">
          {row.quantity} {row.atkItem.unit || "pcs"}
        </span>
      ),
    },
    {
      header: "Tanggal",
      accessor: (row) => (
        <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
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
      accessor: (row) => <Badge status={row.status} size="sm" />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 print:p-0">
        {/* Page Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan & Analisis Pengajuan ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekapitulasi penggunaan dan pengadaan alat tulis kantor berdasarkan periode waktu, departemen, dan kategori.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2.5 print:hidden flex-wrap">
            {/* Export CSV Button */}
            <Button
              variant="success"
              size="md"
              isLoading={isExporting}
              onClick={handleExportCsv}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Ekspor ke CSV (.csv)
            </Button>

            {/* Print Button */}
            <Button
              variant="outline"
              size="md"
              onClick={handlePrint}
              className="text-slate-700 font-semibold"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              }
            >
              Cetak
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <Card title="Filter & Parameter Laporan" className="print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Select
                label="Kategori Pengajuan"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "" | "regular" | "purchase")}
                options={[
                  { value: "", label: "Semua Kategori (Permintaan & Pembelian)" },
                  { value: "regular", label: "Permintaan ATK Gudang Saja" },
                  { value: "purchase", label: "Pengajuan Pembelian ATK Saja" },
                ]}
              />
            </div>

            <div>
              <Select
                label="Pilih Departemen"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[
                  { value: "", label: "Semua Departemen" },
                  ...departments.map((d) => ({ value: d, label: d })),
                ]}
              />
            </div>

            <div>
              <Input
                label="Tanggal Mulai"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Tanggal Akhir"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {(startDate || endDate || department || typeFilter) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>✕ Reset Semua Filter</span>
              </button>
            </div>
          )}
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Transaksi Masuk"
            value={reportData.summary.total}
            color="orange"
            description="Total berkas pengajuan dalam periode ini"
          />
          <StatCard
            title="Departemen Aktif"
            value={departmentRows.length}
            color="blue"
            description="Jumlah divisi/departemen pemohon"
          />
          <StatCard
            title="Jenis Barang Digunakan"
            value={itemRows.length}
            color="emerald"
            description="Total item ATK yang tercatat"
          />
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <Card title="Rekapitulasi per Departemen" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Departemen</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Disetujui/Selesai</th>
                    <th className="px-4 py-3 text-right">Ditolak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data pada filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    departmentRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {r.department}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          {r.total}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {r.approved}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          {r.rejected}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Item Breakdown */}
          <Card title="Top Barang ATK Paling Sering Diajukan" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3 text-right">Frekuensi</th>
                    <th className="px-4 py-3 text-right">Total Kuantitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data pada filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    itemRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {r.name}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          {r.total} kali
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-[#FF5500]">
                          {r.quantity} {r.unit}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detailed Transactions List */}
        <Card
          title="Rincian Transaksi Pengajuan ATK"
          subtitle={`Daftar lengkap seluruh transaksi pengajuan (${reportData.requests.length} data)`}
          noPadding
        >
          <Table
            columns={transactionColumns}
            data={reportData.requests}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            emptyMessage="Tidak ada transaksi pengajuan pada parameter filter yang dipilih."
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
