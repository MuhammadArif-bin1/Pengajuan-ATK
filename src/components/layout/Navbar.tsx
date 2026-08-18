"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    if (pathname.includes("/barang")) return "Kelola Barang ATK";
    if (pathname.includes("/karyawan")) return "Data Karyawan";
    if (pathname.includes("/laporan")) return "Laporan ATK";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white px-4 sm:px-6">
      {/* Left side: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none cursor-pointer"
        >
          <span className="sr-only">Buka Menu</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <span>Portal Admin</span>
          <span>/</span>
          <span className="font-bold text-gray-900">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Right side: Status Badge & Website Link */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-600 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistem Online</span>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors shadow-2xs"
        >
          <span>Website</span>
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
    </header>
  );
};
