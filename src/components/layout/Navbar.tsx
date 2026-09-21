"use client";

import React from "react";
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

  const getPageTitle = () => {
    if (pathname.includes("/dashboard")) return "Portal Administrator ATK";
    if (pathname.includes("/pengajuan")) return "Manajemen Pengajuan ATK";
    if (pathname.includes("/barang") || pathname.includes("/pembelian")) return "Daftar Pengajuan Pembelian ATK";
    if (pathname.includes("/stok")) return "Manajemen Stok ATK";
    if (pathname.includes("/laporan")) return "Laporan & Analisis Pengajuan ATK";
    return "Portal Administrator ATK";
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 shadow-xs print:hidden">
      {/* Left side: Mobile toggle & Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="lg:hidden p-2 rounded-[10px] text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Buka Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-[#323c4d] tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side: Realtime Notifications */}
      <div className="flex items-center gap-3">
        <NotificationDropdown />
      </div>
    </header>
  );
};
