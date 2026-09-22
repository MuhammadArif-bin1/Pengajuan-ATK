"use client";

import React, { useState, useRef, useEffect } from "react";
import type { PortalNotificationItem } from "./types";
import { StatusBadge, getRelativeTime } from "./StatusBadges";

export interface DashboardHeaderProps {
  onOpenSidebar: () => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  isDebouncing: boolean;
  notifications: PortalNotificationItem[];
  unreadIds: Set<string>;
  isRinging: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkAllRead: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenSidebar,
  searchInput,
  onSearchChange,
  onSearchClear,
  isDebouncing,
  notifications,
  unreadIds,
  isRinging,
  soundEnabled,
  onToggleSound,
  onMarkAllRead,
}) => {
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 shadow-xs shrink-0">
        {/* Left: Mobile Menu Trigger & Dashboard Title */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onOpenSidebar}
            type="button"
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Buka Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Pengajuan
          </h1>
        </div>

        {/* Center: Search Bar Pill with 1.5s Debounce - Figma exact #dadee5 */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search Content ..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-[26px] bg-[#dadee5] text-xs sm:text-sm font-bold text-[#323c4d] placeholder-[#6b7a99] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/40 focus:bg-white border border-transparent focus:border-[#ff8f00]/50 transition-all shadow-2xs"
            />
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a99] pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Debounce / Clear Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isDebouncing && (
                <span className="flex h-3 w-3 relative" title="Menunggu debounce 1.5 detik...">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff8f00]" />
                </span>
              )}
              {searchInput && !isDebouncing && (
                <button
                  type="button"
                  onClick={onSearchClear}
                  className="text-[#6b7a99] hover:text-slate-700 text-xs font-bold p-1 rounded-full cursor-pointer"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Notifications Bell Icon */}
        <div className="flex items-center gap-3 relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#ff8f00] hover:bg-orange-50 transition cursor-pointer relative shadow-2xs border border-orange-100"
            aria-label="Notifikasi Pengajuan"
          >
            <svg
              className={`w-6 h-6 transition-transform ${isRinging ? "animate-bounce text-amber-600" : ""}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>

            {unreadIds.size > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#dc2626] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                {unreadIds.size > 9 ? "9+" : unreadIds.size}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">Notifikasi Pengajuan</span>
                  {unreadIds.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#ff8f00] font-extrabold text-[10px]">
                      {unreadIds.size} Baru
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                >
                  {soundEnabled ? "🔔 Suara Aktif" : "🔕 Mute"}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                {notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl transition ${
                      unreadIds.has(notif.id) ? "bg-orange-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900">{notif.itemName}</p>
                      <StatusBadge status={notif.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Pemohon: <span className="font-semibold text-slate-700">{notif.userName}</span> ({notif.department})
                    </p>
                    {notif.adminNote && (
                      <p className="text-[11px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-slate-100 mt-1.5">
                        💬 {notif.adminNote}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {getRelativeTime(notif.updatedAt)}
                    </span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada pembaruan status pengajuan
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-xs font-bold text-[#ff8f00] hover:underline cursor-pointer"
                >
                  Tandai Semua Sudah Dibaca
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Search Input (Visible on small screens) */}
      <div className="md:hidden px-4 pt-4">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search Content ..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-[26px] bg-[#dadee5] text-xs font-bold text-[#323c4d] placeholder-[#6b7a99] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/40 focus:bg-white border border-transparent shadow-inner"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7a99]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {isDebouncing && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff8f00]" />
            </span>
          )}
        </div>
      </div>
    </>
  );
};
