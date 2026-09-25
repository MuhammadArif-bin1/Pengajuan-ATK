import React from "react";
import { Modal } from "@/components/ui/Modal";
import type { AtkRequestData } from "@/types/request";
import { formatDate, formatDateTime, cleanReason } from "./historyHelpers";

export interface HistoryDetailModalProps {
  request: AtkRequestData | null;
  onClose: () => void;
}

export function HistoryDetailModal({ request, onClose }: HistoryDetailModalProps) {
  if (!request) return null;

  const isRejected = request.status === "DITOLAK";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Detail Riwayat Pengajuan"
      subtitle={`Tiket #${request.id.slice(-8).toUpperCase()} • ${request.user.name}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold text-slate-500">
            {isRejected ? "Ditolak: " : "Diselesaikan: "}{" "}
            {formatDate(request.processedAt || request.updatedAt)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[8px] transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-1 text-xs">
        {/* Status Header Box */}
        {isRejected ? (
          <div className="p-3.5 rounded-[10px] bg-rose-50 border border-rose-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">❌</span>
              <div>
                <p className="font-bold text-rose-900 text-xs">Pengajuan Ditolak</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Permohonan ATK ditolak oleh administrator
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
              DITOLAK
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-[10px] bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-bold text-emerald-900 text-xs">Pengajuan Telah Selesai</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Barang ATK telah diserahkan kepada pemohon
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
              SELESAI
            </span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-[10px] bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Nama Pemohon
            </span>
            <span className="text-xs font-black text-slate-900 block">
              {request.user.name}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Departemen / Jabatan
            </span>
            <span className="text-xs font-bold text-slate-800 block">
              {request.user.department} • {request.user.position}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Barang ATK
            </span>
            <span className="text-xs font-black text-[#ff8f00] block">
              {request.atkItem.name}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              {isRejected ? "Jumlah Diajukan" : "Jumlah Diserahkan"}
            </span>
            <span className="text-xs font-black text-slate-900 block">
              {request.quantity} {request.atkItem.unit}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Waktu Pengajuan
            </span>
            <span className="text-xs font-semibold text-slate-700 block">
              {formatDateTime(request.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              {isRejected ? "Waktu Ditolak" : "Waktu Diselesaikan"}
            </span>
            <span className="text-xs font-semibold text-slate-700 block">
              {formatDateTime(request.processedAt || request.updatedAt)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              {isRejected ? "Ditolak Oleh" : "Diproses / Disetujui Oleh"}
            </span>
            <span className="text-xs font-bold text-slate-800 block">
              {request.processor?.name || "Administrator"}
            </span>
          </div>
        </div>

        {/* Reason & Admin Note */}
        {request.reason && (
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Keterangan / Alasan Pengajuan:
            </span>
            <div className="p-3 rounded-[8px] bg-white border border-slate-200 text-slate-700 leading-relaxed text-[11.5px]">
              {cleanReason(request.reason)}
            </div>
          </div>
        )}

        {request.adminNote && (
          <div>
            <span
              className={`text-xs font-bold ${
                isRejected ? "text-rose-800" : "text-amber-800"
              } block mb-1`}
            >
              {isRejected
                ? "Alasan / Catatan Penolakan Administrator:"
                : "Catatan dari Administrator:"}
            </span>
            <div
              className={`p-3 rounded-[8px] ${
                isRejected
                  ? "bg-rose-50/80 border border-rose-200 text-rose-900"
                  : "bg-amber-50/80 border border-amber-200 text-amber-900"
              } leading-relaxed text-[11.5px]`}>
              {request.adminNote}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
