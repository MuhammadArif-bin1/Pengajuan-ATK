"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import type { PortalNotificationItem, QueueSortOrder } from "./types";
import { StatusBadge, getRelativeTime } from "./StatusBadges";

export interface QueueListCardProps {
  items: PortalNotificationItem[];
  loading: boolean;
  sortOrder: QueueSortOrder;
  onSortOrderChange: (order: QueueSortOrder) => void;
  debouncedSearch: string;
  className?: string;
}

export const QueueListCard: React.FC<QueueListCardProps> = ({
  items,
  loading,
  sortOrder,
  onSortOrderChange,
  debouncedSearch,
  className = "",
}) => {
  const [queueSortOpen, setQueueSortOpen] = useState(false);
  const queueSortRef = useRef<HTMLDivElement>(null);

  // Click outside to close sort dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (queueSortRef.current && !queueSortRef.current.contains(e.target as Node)) {
        setQueueSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Escape handler to close sort dropdown
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && queueSortOpen) {
        setQueueSortOpen(false);
      }
    }
    if (queueSortOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [queueSortOpen]);

  // Hanya menampilkan permohonan ATK reguler (permohonan pembelian tidak masuk ke antrian)
  // Pengajuan yang statusnya telah SELESAI atau DITOLAK hanya muncul pada hari tersebut, dan hilang di hari berikutnya
  const displayItems = useMemo(() => {
    return items.filter((item) => {
      if (item.isPurchase) return false;

      if (item.status === "SELESAI" || item.status === "DITOLAK") {
        const completionDateStr = item.processedAt || item.updatedAt || item.createdAt;
        if (completionDateStr) {
          const compDate = new Date(completionDateStr);
          const now = new Date();
          const isToday =
            compDate.getFullYear() === now.getFullYear() &&
            compDate.getMonth() === now.getMonth() &&
            compDate.getDate() === now.getDate();
          if (!isToday) return false;
        }
      }

      return true;
    });
  }, [items]);

  return (
    <div className={`bg-white rounded-[12px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-5 sm:p-6 flex flex-col relative transition-all duration-200 h-full min-h-[460px] lg:min-h-0 ${className}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#ebeef2] shrink-0">
        <div className="flex items-center gap-3">
          {/* Stack/Queue Icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-50/60 border border-blue-100/80 flex items-center justify-center text-blue-600 shadow-2xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="7" width="14" height="14" rx="2.5" fill="#3B82F6" fillOpacity="0.15" stroke="#2563EB" strokeWidth="1.75" />
              <path d="M7 4H19C20.1046 4 21 4.89543 21 6V17" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-[22px] font-black text-[#323c4d] tracking-tight">
              Antrian
            </h2>
            <p className="text-[11px] text-[#606c80] font-medium">
              Status berkas permohonan ATK yang diajukan
            </p>
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="relative" ref={queueSortRef}>
          <button
            type="button"
            onClick={() => setQueueSortOpen(!queueSortOpen)}
            className="inline-flex items-center justify-between gap-2 px-3 h-[34px] rounded-[8px] border border-[#ebeef2] text-[11px] font-bold text-[#606c80] bg-white hover:bg-slate-50 shadow-2xs transition cursor-pointer min-w-[110px]"
          >
            <span>Sorting</span>
            <svg className="w-3.5 h-3.5 text-[#606c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10m0 0l-3-3m3 3l3-3M21 17V7m0 0l3 3m-3-3l-3 3" />
            </svg>
          </button>

          {queueSortOpen && (
            <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-40 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  onSortOrderChange("NEWEST");
                  setQueueSortOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                  sortOrder === "NEWEST" ? "bg-orange-50 text-[#ff8f00] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                ⏱️ Waktu Terbaru
              </button>
              <button
                type="button"
                onClick={() => {
                  onSortOrderChange("OLDEST");
                  setQueueSortOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                  sortOrder === "OLDEST" ? "bg-orange-50 text-[#ff8f00] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                ⌛ Waktu Terlama
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Antrian Items Content List */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 divide-y divide-slate-100 min-h-0">
        {loading ? (
          <div className="space-y-2.5 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="py-3.5 px-2 rounded-xl flex items-start justify-between gap-4 animate-pulse bg-slate-50/40"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3.5 bg-slate-200 rounded-md"
                      style={{ width: `${90 + (i % 2) * 25}px` }}
                    />
                    <div className="h-3 bg-slate-200/60 rounded-md w-20" />
                  </div>
                  <div
                    className="h-3 bg-slate-200/80 rounded-md"
                    style={{ width: `${140 + (i % 3) * 30}px` }}
                  />
                  <div className="h-2.5 bg-slate-200/50 rounded-md w-24" />
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
              🗂️
            </div>
            <p className="text-sm font-bold text-slate-700">Belum ada antrian pengajuan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {debouncedSearch
                ? "Tidak ada pengajuan yang cocok dengan pencarian"
                : "Permohonan baru yang diajukan karyawan akan tampil otomatis di sini."}
            </p>
          </div>
        ) : (
          displayItems.map((req) => (
            <div
              key={req.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-4 group hover:bg-slate-50/70 px-2 rounded-xl transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-900">
                    {req.userName}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    • {req.department}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium ml-auto sm:ml-0">
                    ({getRelativeTime(req.createdAt)})
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-700">
                    {req.itemName}
                  </p>
                  <span className="text-[11px] font-extrabold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100">
                    {req.quantity} {req.unit}
                  </span>
                </div>

                {req.reason && (
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Alasan: {req.reason}
                  </p>
                )}

                {req.adminNote && (
                  <p className="text-[10.5px] text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-lg px-2 py-1 mt-1.5 inline-block">
                    Catatan Admin: {req.adminNote}
                  </p>
                )}
              </div>

              <div className="shrink-0 pt-0.5">
                <StatusBadge status={req.status} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Card Footer Summary */}
      <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
        <span>Total: <b className="text-slate-800">{displayItems.length}</b> antrian aktif</span>
        <Link
          href="/user/riwayat"
          className="text-[11.5px] font-bold text-[#ff8f00] hover:text-[#e07d00] hover:underline flex items-center gap-1 transition"
        >
          <span>Lihat Riwayat</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
};
