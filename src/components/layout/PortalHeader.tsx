"use client";

import React, { useState, useRef, useEffect } from "react";
import type { PortalNotificationItem } from "@/components/dashboard/types";
import { StatusBadge, getRelativeTime } from "@/components/dashboard/StatusBadges";

export interface PortalHeaderSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isDebouncing?: boolean;
  placeholder?: string;
}

export interface PortalHeaderProps {
  title: string;
  onOpenSidebar: () => void;
  search?: PortalHeaderSearchProps;
  notifications: PortalNotificationItem[];
  unreadIds?: Set<string>;
  unreadCount?: number;
  isRinging?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onMarkAllRead?: () => void;
  onMarkItemRead?: (id: string) => void;
  badgeCount?: number;
  livePopup?: PortalNotificationItem | null;
  onDismissLivePopup?: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  title,
  onOpenSidebar,
  search,
  notifications,
  unreadIds = new Set(),
  unreadCount,
  isRinging = false,
  soundEnabled = true,
  onToggleSound,
  onMarkAllRead,
  onMarkItemRead,
  badgeCount,
  livePopup,
  onDismissLivePopup,
}) => {
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown and dismiss live popup on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (notifDropdownOpen) setNotifDropdownOpen(false);
        if (livePopup && onDismissLivePopup) onDismissLivePopup();
      }
    }
    if (notifDropdownOpen || livePopup) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [notifDropdownOpen, livePopup, onDismissLivePopup]);

  const displayBadgeNumber = badgeCount !== undefined
    ? badgeCount
    : unreadCount !== undefined
    ? unreadCount
    : unreadIds.size;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 shadow-xs shrink-0 print:hidden">
        {/* Left: Mobile Menu Trigger & Title */}
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
            {title}
          </h1>
        </div>

        {/* Center: Search Bar Pill (optional, shown when search prop is provided) */}
        {search && (
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={search.placeholder || "Search Content ..."}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-[26px] bg-[#dadee5] text-xs sm:text-sm font-bold text-[#323c4d] placeholder-[#6b7a99] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/40 focus:bg-white border border-transparent focus:border-[#ff8f00]/50 transition-all shadow-2xs"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a99] pointer-events-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search.isDebouncing && (
                  <span className="flex h-3 w-3 relative" title="Menunggu debounce...">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff8f00]" />
                  </span>
                )}
                {search.value && !search.isDebouncing && (
                  <button
                    type="button"
                    onClick={search.onClear}
                    className="text-[#6b7a99] hover:text-slate-700 text-xs font-bold p-1 rounded-full cursor-pointer"
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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

            {displayBadgeNumber > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#dc2626] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                {displayBadgeNumber > 9 ? "9+" : displayBadgeNumber}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {notifDropdownOpen && (
            <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">Notifikasi Pengajuan</span>
                  {displayBadgeNumber > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#ff8f00] font-extrabold text-[10px]">
                      {displayBadgeNumber} Baru
                    </span>
                  )}
                </div>
                {onToggleSound && (
                  <button
                    type="button"
                    onClick={onToggleSound}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {soundEnabled ? "🔔 Suara Aktif" : "🔕 Mute"}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                {notifications.slice(0, 10).map((notif) => {
                  const isUnread = unreadIds.has(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (isUnread && onMarkItemRead) {
                          onMarkItemRead(notif.id);
                        }
                      }}
                      className={`p-3 rounded-xl transition ${
                        isUnread
                          ? "bg-orange-50/70 border-l-2 border-[#ff8f00] cursor-pointer hover:bg-orange-100/60"
                          : "hover:bg-slate-50"
                      }`}
                      role={isUnread ? "button" : undefined}
                      tabIndex={isUnread ? 0 : undefined}
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
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-400">
                          {getRelativeTime(notif.updatedAt)}
                        </span>
                        {isUnread && (
                          <span className="text-[10px] text-[#ff8f00] font-bold">
                            Belum dibaca
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada pembaruan status pengajuan
                  </div>
                )}
              </div>

              {onMarkAllRead && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="text-xs font-bold text-[#ff8f00] hover:underline cursor-pointer"
                  >
                    Tandai Semua Sudah Dibaca
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Floating Live Popup Notification Banner */}
      {livePopup && (
        <div className="fixed top-20 inset-x-3.5 sm:inset-x-auto sm:right-6 z-50 max-w-sm w-auto sm:w-full bg-white rounded-[14px] shadow-2xl border-2 border-[#ff8f00] p-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff8f00] border border-orange-200 flex items-center justify-center shrink-0 font-bold text-lg animate-bounce">
                🔔
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-[#ff8f00] uppercase tracking-wider block">
                  {livePopup.status === "SELESAI"
                    ? "🎉 Pengajuan Selesai!"
                    : livePopup.status === "DITOLAK"
                    ? "❌ Pengajuan Ditolak"
                    : "📋 Pengajuan ATK Masuk!"}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {livePopup.userName} ({livePopup.department})
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  <b className="text-slate-900">{livePopup.itemName}</b> ({livePopup.quantity} {livePopup.unit})
                </p>
                {livePopup.adminNote && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg mt-1 border border-slate-100 italic">
                    💬 {livePopup.adminNote}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onDismissLivePopup}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              aria-label="Tutup Notifikasi"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-medium">
              Baru saja diterima
            </span>
            <button
              type="button"
              onClick={() => {
                if (onMarkItemRead) onMarkItemRead(livePopup.id);
                if (onDismissLivePopup) onDismissLivePopup();
              }}
              className="text-xs font-bold text-[#ff8f00] hover:underline cursor-pointer"
            >
              Tandai Dibaca
            </button>
          </div>
        </div>
      )}

      {/* Mobile Search Input (Visible on small screens when search prop is passed) */}
      {search && (
        <div className="md:hidden px-4 pt-4 print:hidden">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={search.placeholder || "Search Content ..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-[26px] bg-[#dadee5] text-xs font-bold text-[#323c4d] placeholder-[#6b7a99] focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/40 focus:bg-white border border-transparent shadow-inner"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7a99]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {search.isDebouncing && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff8f00]" />
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
