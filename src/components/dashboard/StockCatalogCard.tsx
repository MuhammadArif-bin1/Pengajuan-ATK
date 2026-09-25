"use client";

import React, { useState, useRef, useEffect } from "react";
import type { AtkCatalogItem, StockStatusFilter } from "./types";
import { StockBadge } from "./StatusBadges";

export interface StockCatalogCardProps {
  items: AtkCatalogItem[];
  loading: boolean;
  statusFilter: StockStatusFilter;
  onStatusFilterChange: (filter: StockStatusFilter) => void;
  debouncedSearch: string;
  className?: string;
}

export const StockCatalogCard: React.FC<StockCatalogCardProps> = ({
  items,
  loading,
  statusFilter,
  onStatusFilterChange,
  debouncedSearch,
  className = "",
}) => {
  const [stockFilterOpen, setStockFilterOpen] = useState(false);
  const stockFilterRef = useRef<HTMLDivElement>(null);

  // Click outside to close filter dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (stockFilterRef.current && !stockFilterRef.current.contains(e.target as Node)) {
        setStockFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Escape handler to close filter dropdown
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && stockFilterOpen) {
        setStockFilterOpen(false);
      }
    }
    if (stockFilterOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [stockFilterOpen]);

  return (
    <div className={`bg-white rounded-[12px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-5 sm:p-6 flex flex-col relative transition-all duration-200 h-full min-h-[460px] lg:min-h-0 ${className}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#ebeef2] shrink-0">
        <div className="flex items-center gap-3">
          {/* 3D Isometric Cube Icon */}
          <div className="w-10 h-10 rounded-xl bg-indigo-50/60 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-2xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#6366F1" fillOpacity="0.15" stroke="#4F46E5" strokeWidth="1.75" strokeLinejoin="round" />
              <path d="M12 22V12" stroke="#4F46E5" strokeWidth="1.75" strokeLinejoin="round" />
              <path d="M21 7L12 12L3 7" stroke="#4F46E5" strokeWidth="1.75" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-[22px] font-black text-[#323c4d] tracking-tight">
              Stok Barang ATK
            </h2>
            <p className="text-[11px] text-[#606c80] font-medium">
              Monitoring persediaan master logistik kantor
            </p>
          </div>
        </div>

        {/* Filter Ketersediaan Dropdown */}
        <div className="relative" ref={stockFilterRef}>
          <button
            type="button"
            onClick={() => setStockFilterOpen(!stockFilterOpen)}
            className="inline-flex items-center justify-between gap-2 px-3 h-[34px] rounded-[8px] border border-[#ebeef2] text-[11px] font-bold text-[#606c80] bg-white hover:bg-slate-50 shadow-2xs transition cursor-pointer min-w-[140px]"
          >
            <span>
              {statusFilter === "ALL" && "Filter Ketersediaan"}
              {statusFilter === "READY" && "Tersedia (>5)"}
              {statusFilter === "LOW" && "Menipis (1-5)"}
              {statusFilter === "EMPTY" && "Kosong (0)"}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${stockFilterOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {stockFilterOpen && (
            <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-40 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  onStatusFilterChange("ALL");
                  setStockFilterOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                  statusFilter === "ALL" ? "bg-orange-50 text-[#ff8f00] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Semua Ketersediaan
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusFilterChange("READY");
                  setStockFilterOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  statusFilter === "READY" ? "bg-orange-50 text-[#ff8f00] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Tersedia</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusFilterChange("LOW");
                  setStockFilterOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  statusFilter === "LOW" ? "bg-orange-50 text-[#ff8f00] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Menipis</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusFilterChange("EMPTY");
                  setStockFilterOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  statusFilter === "EMPTY" ? "bg-orange-50 text-[#ff8f00] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Kosong</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stock Items Content List */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 divide-y divide-slate-100 min-h-0">
        {loading ? (
          <div className="space-y-2.5 py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="py-3 px-2 rounded-xl flex items-center justify-between gap-3 animate-pulse bg-slate-50/40"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-slate-200 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div
                      className="h-3.5 bg-slate-200 rounded-md"
                      style={{ width: `${60 + (i % 3) * 15}%` }}
                    />
                    <div className="h-2.5 bg-slate-200/70 rounded-md w-28" />
                  </div>
                </div>
                <div className="h-7 w-20 bg-slate-200 rounded-[6px] shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
              📦
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ada barang ATK ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {debouncedSearch
                ? "Coba gunakan kata kunci pencarian yang berbeda"
                : "Data barang belum tersedia di katalog."}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 group hover:bg-slate-50/70 px-2 rounded-xl transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-[#FF7A00] transition-colors truncate">
                    {item.name}
                  </p>
                  <StockBadge stock={item.stock} />
                </div>
                {item.description ? (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-0.5 italic">
                    Tanpa keterangan tambahan
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-base font-black text-slate-900">
                    {item.stock}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    {item.unit || "pcs"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Card Footer Summary */}
      <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
        <span>Total: <b className="text-slate-800">{items.length}</b> barang ATK</span>
        <span className="text-[11px] text-slate-400">Pembaruan otomatis real-time</span>
      </div>
    </div>
  );
};
