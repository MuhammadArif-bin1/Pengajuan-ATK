"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationDropdown } from "./NotificationDropdown";

export interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: "ADMIN" | "USER";
    department?: string;
    position?: string;
  } | null;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();

  const getBreadcrumb = () => {
    if (pathname.includes("/dashboard")) return "Dashboard";
    if (pathname.includes("/pengajuan")) return "Pengajuan ATK";
    if (pathname.includes("/barang") || pathname.includes("/pembelian")) return "Daftar Pengajuan Pembelian ATK";
    if (pathname.includes("/laporan")) return "Laporan ATK";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Left side: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer transition"
        >
          <span className="sr-only">Buka Menu</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1 hidden sm:flex">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Portal Admin</span>
          </span>
          <svg className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-bold text-slate-900 bg-slate-100/90 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80">
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Right side: Realtime Notifications, Status Badge & Website Link */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Realtime Notification Bell & Dropdown */}
        <NotificationDropdown />

        {/* Status Online Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Sistem Online</span>
        </div>

        {/* Website Public Portal Link */}
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-orange-50/60 hover:border-[#FF5500]/40 text-slate-700 hover:text-[#FF5500] text-xs font-bold transition-all shadow-2xs cursor-pointer group"
        >
          <span>Website</span>
          <svg className="w-3 h-3 text-slate-400 group-hover:text-[#FF5500] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
    </header>
  );
};
