"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserLayout } from "@/components/layout/UserLayout";
import { StatCard, Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import type { AtkRequestData } from "@/types/request";

export default function UserDashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    disetujui: 0,
    ditolak: 0,
    diproses: 0,
    selesai: 0,
  });
  const [recentRequests, setRecentRequests] = useState<AtkRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, requestsRes] = await Promise.all([
          fetch("/api/requests/stats"),
          fetch("/api/requests?limit=5"),
        ]);

        if (statsRes.ok) {
          const sData = await statsRes.json();
          if (sData.requests) setStats(sData.requests);
        }

        if (requestsRes.ok) {
          const rData = await requestsRes.json();
          if (rData.data) setRecentRequests(rData.data);
        }
      } catch (err) {
        console.error("Failed to load user dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const columns: Column<AtkRequestData>[] = [
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
              Dashboard Karyawan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Pantau status pengajuan alat tulis kantor dan riwayat pengadaan Anda.
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
              Buat Pengajuan ATK
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <StatCard
            title="Total Pengajuan"
            value={stats.total}
            color="indigo"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            title="Menunggu"
            value={stats.menunggu}
            color="amber"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Disetujui"
            value={stats.disetujui}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Selesai"
            value={stats.selesai}
            color="emerald"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <StatCard
            title="Ditolak"
            value={stats.ditolak}
            color="rose"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Recent Requests Table */}
        <Card
          title="Pengajuan Terbaru"
          subtitle="Daftar 5 pengajuan ATK terakhir yang Anda ajukan"
          action={
            <Link href="/user/pengajuan">
              <Button variant="ghost" size="sm">
                Lihat Semua Riwayat →
              </Button>
            </Link>
          }
          noPadding
        >
          <Table
            columns={columns}
            data={recentRequests}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            emptyMessage="Belum ada riwayat pengajuan ATK. Klik 'Buat Pengajuan ATK' untuk memulai."
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
