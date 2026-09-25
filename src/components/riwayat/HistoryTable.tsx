import React from "react";
import type { AtkRequestData } from "@/types/request";
import { formatDate, cleanReason } from "./historyHelpers";

export interface HistoryTableProps {
  requests: AtkRequestData[];
  total: number;
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onSelectRequest: (req: AtkRequestData) => void;
  isFiltered: boolean;
  onResetFilters: () => void;
}

export function HistoryTable({
  requests,
  total,
  loading,
  page,
  totalPages,
  onPageChange,
  onSelectRequest,
  isFiltered,
  onResetFilters,
}: HistoryTableProps) {
  return (
    <div className="bg-white rounded-[12px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] overflow-hidden">
      {/* Table Header Details */}
      <div className="px-5 sm:px-6 py-4 border-b border-[#ebeef2] flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-[#323c4d] tracking-tight">
            Daftar Riwayat Pengajuan
          </h3>
          <p className="text-xs text-[#606c80] font-medium mt-0.5">
            Menampilkan {requests.length} dari total {total} berkas riwayat
          </p>
        </div>

        {/* Status & Print Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#ebeef2] bg-white hover:bg-slate-50 text-xs font-bold text-[#323c4d] transition shadow-2xs cursor-pointer print:hidden"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-[#ff8f00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Memuat riwayat pengajuan...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-20 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-2xl shadow-2xs">
            📂
          </div>
          <h4 className="text-sm font-bold text-slate-700">Belum ada data riwayat</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isFiltered
              ? "Tidak ada permohonan yang sesuai dengan filter pencarian Anda."
              : "Pengajuan ATK yang telah selesai diproses atau ditolak oleh administrator akan secara otomatis diarsipkan di sini."}
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#ff8f00] hover:bg-[#e07d00] rounded-[8px] transition cursor-pointer shadow-xs"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#ebeef2] bg-slate-50/70 text-[10px] font-bold text-[#606c80] uppercase tracking-wider">
                <th className="text-center px-4 py-3.5 w-12">NO</th>
                <th className="text-left px-5 py-3.5">PEMOHON</th>
                <th className="text-left px-5 py-3.5">BARANG ATK</th>
                <th className="text-center px-4 py-3.5">JUMLAH</th>
                <th className="text-left px-5 py-3.5">TGL PENGAJUAN</th>
                <th className="text-left px-5 py-3.5">TGL PROSES</th>
                <th className="text-left px-5 py-3.5">DIPROSES OLEH</th>
                <th className="text-center px-4 py-3.5">STATUS</th>
                <th className="text-right px-5 py-3.5 print:hidden">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebeef2]">
              {requests.map((req, idx) => {
                const rowNum = (page - 1) * 10 + idx + 1;
                return (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="text-center px-4 py-4 text-slate-400 font-bold">
                      {rowNum}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#323c4d] text-xs">{req.user.name}</p>
                      <p className="text-[11px] text-[#606c80] font-medium mt-0.5">
                        {req.user.department} • {req.user.position}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#323c4d] text-xs">{req.atkItem.name}</p>
                      {req.reason && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          Ket: {cleanReason(req.reason)}
                        </p>
                      )}
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-[6px] text-xs font-black bg-slate-100 text-slate-800">
                        {req.quantity} {req.atkItem.unit}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-800 font-bold">
                        {formatDate(req.processedAt || req.updatedAt)}
                      </p>
                      <p className="text-[10.5px] text-slate-400 font-medium">
                        {new Date(req.processedAt || req.updatedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} WIB
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {req.processor?.name || "Administrator"}
                    </td>
                    <td className="text-center px-4 py-4">
                      {req.status === "DITOLAK" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Ditolak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Selesai
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => onSelectRequest(req)}
                        className="px-3 py-1.5 rounded-[8px] border border-[#ebeef2] text-[#323c4d] hover:bg-slate-50 text-xs font-bold transition shadow-2xs cursor-pointer hover:border-slate-300"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Footer: Pagination */}
      {!loading && totalPages > 1 && (
        <div className="px-5 sm:px-6 py-4 border-t border-[#ebeef2] flex items-center justify-between gap-4 text-xs font-medium text-slate-600 print:hidden">
          <span>
            Halaman <b className="text-slate-900">{page}</b> dari <b className="text-slate-900">{totalPages}</b>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="px-3 py-1.5 rounded-[8px] border border-[#ebeef2] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-bold"
            >
              ← Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="px-3 py-1.5 rounded-[8px] border border-[#ebeef2] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-bold"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
