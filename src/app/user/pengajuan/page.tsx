"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import type { AtkRequestData, RequestStatusType } from "@/types/request";

export default function RiwayatPengajuanPage() {
  const [requests, setRequests] = useState<AtkRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const statuses: { label: string; value: string }[] = [
    { label: "Semua Status", value: "" },
    { label: "Menunggu", value: "MENUNGGU" },
    { label: "Disetujui", value: "DISETUJUI" },
    { label: "Diproses", value: "DIPROSES" },
    { label: "Selesai", value: "SELESAI" },
    { label: "Ditolak", value: "DITOLAK" },
  ];

  const columns: Column<AtkRequestData>[] = [
    {
      header: "No",
      className: "w-12 text-center text-slate-400 text-xs",
      headerClassName: "text-center",
      accessor: (_row: AtkRequestData, idx: number) => (page - 1) * 10 + idx + 1,
    },
    {
      header: "Barang ATK",
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.atkItem.name}</p>
          <p className="text-xs text-slate-400 truncate max-w-xs">{row.reason}</p>
        </div>
      ),
    },
    {
      header: "Jumlah",
      accessor: (row) => (
        <span className="font-medium text-slate-900">
          {row.quantity} {row.atkItem.unit}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedRequest(row)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Riwayat Pengajuan ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Daftar seluruh riwayat pengajuan ATK yang pernah Anda buat.
            </p>
          </div>
          <Link href="/user/pengajuan/buat">
            <Button
              variant="primary"
              size="md"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Buat Pengajuan Baru
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatusFilter(s.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                statusFilter === s.value
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

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
            emptyMessage={
              statusFilter
                ? `Tidak ada pengajuan dengan status '${statusFilter}'`
                : "Belum ada riwayat pengajuan ATK."
            }
          />
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Detail Pengajuan ATK"
          subtitle={`ID: #${selectedRequest.id.slice(-8)}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
              Tutup
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status Saat Ini
              </span>
              <Badge status={selectedRequest.status} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Barang ATK</p>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">
                  {selectedRequest.atkItem.name}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Jumlah Diminta</p>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">
                  {selectedRequest.quantity} {selectedRequest.atkItem.unit}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Tanggal Pengajuan</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {new Date(selectedRequest.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Terakhir Diperbarui</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {new Date(selectedRequest.updatedAt).toLocaleString("id-ID")}
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
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Catatan dari Admin
                </p>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {selectedRequest.adminNote}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </UserLayout>
  );
}
