"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface ReportSummary {
  total: number;
  byDepartment: Record<
    string,
    { total: number; approved: number; rejected: number }
  >;
  byItem: Record<string, { total: number; quantity: number }>;
}

export default function AdminLaporanPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    requests: any[];
    summary: ReportSummary;
  }>({
    requests: [],
    summary: { total: 0, byDepartment: {}, byItem: {} },
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
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

      const res = await fetch(`/api/requests/report?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        toast.error("Gagal mengambil data laporan");
      }
    } catch (err) {
      console.error("Fetch report error:", err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, department, toast]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const departmentRows = Object.entries(reportData.summary.byDepartment).map(
    ([dept, val]) => ({
      department: dept,
      total: val.total,
      approved: val.approved,
      rejected: val.rejected,
    })
  );

  const itemRows = Object.entries(reportData.summary.byItem).map(
    ([name, val]) => ({
      name,
      total: val.total,
      quantity: val.quantity,
    })
  );

  const transactionColumns: Column<any>[] = [
    {
      header: "No",
      className: "w-12 text-center text-xs text-slate-400",
      accessor: (_row: any, idx: number) => idx + 1,
    },
    {
      header: "Karyawan",
      accessor: (row) => (
        <span className="font-semibold text-slate-900">{row.user.name}</span>
      ),
    },
    {
      header: "Departemen",
      accessor: (row) => (
        <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
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
        <span className="font-bold text-slate-900">
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
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 print:p-0">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan & Analisis Pengajuan ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekapitulasi penggunaan alat tulis kantor berdasarkan periode waktu, departemen, dan barang.
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrint}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              }
            >
              Cetak / Ekspor PDF
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <Card title="Filter Periode & Departemen" className="print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          </div>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Transaksi Masuk"
            value={reportData.summary.total}
            color="indigo"
          />
          <StatCard
            title="Departemen Aktif"
            value={departmentRows.length}
            color="blue"
          />
          <StatCard
            title="Jenis Barang Digunakan"
            value={itemRows.length}
            color="emerald"
          />
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <Card title="Rekapitulasi per Departemen" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Departemen</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Disetujui</th>
                    <th className="px-4 py-3 text-right">Ditolak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    departmentRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {r.department}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {r.total}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                          {r.approved}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-rose-600">
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
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3 text-right">Frekuensi Pengajuan</th>
                    <th className="px-4 py-3 text-right">Total Kuantitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    itemRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {r.name}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {r.total} kali
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">
                          {r.quantity}
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
          subtitle="Daftar lengkap seluruh pengajuan yang masuk dalam filter saat ini"
          noPadding
        >
          <Table
            columns={transactionColumns}
            data={reportData.requests}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            emptyMessage="Tidak ada transaksi pengajuan pada periode yang dipilih."
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
