import React from "react";

export type DateMode = "all" | "today" | "month" | "year" | "range";
export type SortOrder = "NEWEST" | "OLDEST";

export interface HistoryFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  departments: string[];
  departmentFilter: string;
  onDepartmentChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  dateMode: DateMode;
  onDateModeChange: (val: DateMode) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (val: SortOrder) => void;
  debouncedSearch: string;
  onResetFilters: () => void;
}

export function HistoryFilterBar({
  search,
  onSearchChange,
  departments,
  departmentFilter,
  onDepartmentChange,
  statusFilter,
  onStatusFilterChange,
  dateMode,
  onDateModeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  sortOrder,
  onSortOrderChange,
  debouncedSearch,
  onResetFilters,
}: HistoryFilterBarProps) {
  const hasActiveFilters = Boolean(
    debouncedSearch || departmentFilter || statusFilter !== "ALL" || dateMode !== "all" || sortOrder !== "NEWEST"
  );

  return (
    <div className="bg-white rounded-[12px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-4 sm:p-6 space-y-4 print:hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        {/* Search Bar */}
        <div className="md:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama pemohon, divisi, barang..."
            className="w-full pl-10 pr-9 h-[42px] rounded-[8px] border border-[#ebeef2] bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ff8f00] focus:ring-1 focus:ring-[#ff8f00] transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Departemen Filter */}
        <div className="md:col-span-2">
          <select
            value={departmentFilter}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full h-[42px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#ff8f00] focus:ring-1 focus:ring-[#ff8f00] transition cursor-pointer"
          >
            <option value="">Semua Divisi</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full h-[42px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#ff8f00] focus:ring-1 focus:ring-[#ff8f00] transition cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>

        {/* Periode Waktu Select */}
        <div className="md:col-span-2">
          <select
            value={dateMode}
            onChange={(e) => onDateModeChange(e.target.value as DateMode)}
            className="w-full h-[42px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#ff8f00] focus:ring-1 focus:ring-[#ff8f00] transition cursor-pointer"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="range">Rentang Tanggal</option>
          </select>
        </div>

        {/* Sorting Filter */}
        <div className="md:col-span-2 flex items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
            className="w-full h-[42px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#ff8f00] focus:ring-1 focus:ring-[#ff8f00] transition cursor-pointer"
          >
            <option value="NEWEST">Waktu Terbaru</option>
            <option value="OLDEST">Waktu Terlama</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range Picker (shown when dateMode === "range") */}
      {dateMode === "range" && (
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <span className="text-xs font-bold text-slate-600">Dari:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-[38px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#ff8f00]"
          />
          <span className="text-xs font-bold text-slate-600">Sampai:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-[38px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#ff8f00]"
          />
        </div>
      )}

      {/* Active Filter summary & Reset Button */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Filter aktif:{" "}
            {debouncedSearch && <b className="text-slate-800 mr-2">Cari: "{debouncedSearch}"</b>}
            {departmentFilter && <b className="text-slate-800 mr-2">Divisi: {departmentFilter}</b>}
            {statusFilter !== "ALL" && (
              <b className="text-slate-800 mr-2">
                Status: {statusFilter === "SELESAI" ? "Selesai" : "Ditolak"}
              </b>
            )}
            {dateMode !== "all" && <b className="text-slate-800 mr-2">Periode: {dateMode}</b>}
            {sortOrder === "OLDEST" && <b className="text-slate-800">Urutan Terlama</b>}
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-bold text-[#ff8f00] hover:text-[#e07d00] transition cursor-pointer hover:underline"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
