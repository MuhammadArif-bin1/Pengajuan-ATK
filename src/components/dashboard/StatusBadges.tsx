import React from "react";
import type { PortalNotificationItem } from "./types";

// Relative Time Helper
export function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} mnt lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const days = Math.floor(hr / 24);
  return `${days} hari lalu`;
}

// Format Date & Time Helper
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

// Status Badge Component
export function StatusBadge({ status }: { status: PortalNotificationItem["status"] }) {
  switch (status) {
    case "SELESAI":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Selesai
        </span>
      );
    case "DITOLAK":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Ditolak
        </span>
      );
    case "DIPROSES":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Diproses
        </span>
      );
  }
}

// Stock Status Badge
export function StockBadge({ stock }: { stock: number }) {
  if (stock > 5) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Tersedia
      </span>
    );
  }
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Menipis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      Kosong
    </span>
  );
}
