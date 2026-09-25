import React from "react";

export interface HistoryStatsCardsProps {
  total: number;
  completedTodayCount: number;
  totalQuantity: number;
}

export function HistoryStatsCards({
  total,
  completedTodayCount,
  totalQuantity,
}: HistoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
      {/* Stat 1: Total Riwayat */}
      <div className="bg-white rounded-[10px] border border-[#ebeef2] p-5 shadow-2xs">
        <div className="flex items-center justify-between text-[#606c80] text-[11px] font-bold uppercase tracking-wider">
          <span>TOTAL RIWAYAT</span>
          <span className="w-7 h-7 rounded-[6px] bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
            📋
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl sm:text-3xl font-black text-[#323c4d] tracking-tight">
            {total}
          </span>
          <span className="text-xs font-semibold text-slate-400 ml-1.5">Berkas</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-1">
          Total berkas selesai & ditolak
        </p>
      </div>

      {/* Stat 2: Diproses Hari Ini */}
      <div className="bg-white rounded-[10px] border border-[#ebeef2] p-5 shadow-2xs">
        <div className="flex items-center justify-between text-[#606c80] text-[11px] font-bold uppercase tracking-wider">
          <span>DIPROSES HARI INI</span>
          <span className="w-7 h-7 rounded-[6px] bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            ⏱
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
            {completedTodayCount}
          </span>
          <span className="text-xs font-semibold text-slate-400 ml-1.5">Berkas</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-1">
          Tampil juga pada antrian hari ini
        </p>
      </div>

      {/* Stat 3: Total Kuantitas Barang */}
      <div className="bg-white rounded-[10px] border border-[#ebeef2] p-5 shadow-2xs">
        <div className="flex items-center justify-between text-[#606c80] text-[11px] font-bold uppercase tracking-wider">
          <span>TOTAL ITEM</span>
          <span className="w-7 h-7 rounded-[6px] bg-orange-50 text-[#ff8f00] flex items-center justify-center font-bold text-xs">
            📦
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl sm:text-3xl font-black text-[#ff8f00] tracking-tight">
            {totalQuantity}
          </span>
          <span className="text-xs font-semibold text-slate-400 ml-1.5">Unit</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-1">
          Kuantitas barang dalam daftar ini
        </p>
      </div>
    </div>
  );
}
