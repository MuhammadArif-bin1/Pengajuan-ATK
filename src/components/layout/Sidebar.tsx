"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface NavItem {
  id?: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
}

export interface SidebarProps {
  role?: "ADMIN" | "USER" | "PUBLIC";
  isOpen?: boolean;
  onClose?: () => void;
  userName?: string;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  purchaseBadgeCount?: number;
  onFastTrackClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = "PUBLIC",
  isOpen = false,
  onClose,
  userName = "ADMIN LOGISTIK",
  activeTab = "dashboard",
  onSelectTab,
  purchaseBadgeCount = 2,
  onFastTrackClick,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const adminNavItems: NavItem[] = [
    {
      id: "admin-dashboard",
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        </svg>
      ),
    },
    {
      id: "admin-pengajuan",
      label: "Pengajuan ATK",
      href: "/admin/pengajuan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "admin-barang",
      label: "Pengajuan Pembelian",
      href: "/admin/barang",
      badge: purchaseBadgeCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: "admin-stok",
      label: "Manajemen Stok ATK",
      href: "/admin/stok",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: "admin-laporan",
      label: "Laporan ATK",
      href: "/admin/laporan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const publicNavTabs = [
    {
      id: "dashboard",
      label: "Dashboard Pengajuan",
      href: "/",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        </svg>
      ),
    },
    {
      id: "purchase",
      label: "Pengajuan Pembelian",
      href: "/user/pengajuan-pembelian",
      badge: purchaseBadgeCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "history",
      label: "Riwayat",
      href: "/user/riwayat",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container - Clean White Theme with Figma Style */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#ebeef2] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Brand Header */}
            <div className="px-5 py-5 border-b border-[#ebeef2] flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <img
                  src="/Image/logo/Logo.webp"
                  alt="Hasamitra Logo"
                  className="w-full max-w-[192px] h-auto aspect-[6/1] object-contain"
                />
              </Link>

              {onClose && (
                <button
                  onClick={onClose}
                  className="lg:hidden p-1.5 text-[#606c80] hover:text-[#323c4d] rounded-[8px] hover:bg-slate-100 transition"
                  aria-label="Tutup Menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="p-3.5 space-y-1.5 mt-2">
              {role === "ADMIN" ? (
                adminNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "text-[#ff8f00] font-bold"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? "text-[#ff8f00]" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        <span className="text-[13px]">{item.label}</span>
                      </div>

                      {item.badge !== undefined && Number(item.badge) > 0 && (
                        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#ef4444]/15 text-[#dc2626] flex items-center justify-center text-[10.5px] font-black">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : (
                publicNavTabs.map((tab) => {
                  const normalizedPath = decodeURIComponent(pathname);
                  const isTabActive =
                    (tab.href === "/" && pathname === "/") ||
                    (tab.href !== "/" && normalizedPath.startsWith(tab.href)) ||
                    activeTab === tab.id;

                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => {
                        if (onSelectTab) onSelectTab(tab.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isTabActive
                          ? "text-[#ff8f00] font-bold"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isTabActive ? "text-[#ff8f00]" : "text-slate-400"}>
                          {tab.icon}
                        </span>
                        <span className="text-[13px]">{tab.label}</span>
                      </div>

                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#ef4444]/15 text-[#dc2626] flex items-center justify-center text-[10.5px] font-black">
                          {tab.badge}
                        </span>
                      )}
                    </Link>
                  );
                })
              )}
            </nav>
          </div>

          {/* Bottom Action Section (Fast Track & Admin / Portal & Logout) */}
          <div className="p-4 space-y-3 border-t border-[#ebeef2]">
            {role === "ADMIN" ? (
              <>
                {/* Portal Karyawan Button - Matching Figma Fast Track Card Button */}
                <Link
                  href="/"
                  className="w-full h-14 bg-[#37aee2] hover:bg-[#289ecf] text-white rounded-[10px] flex items-center px-4 gap-3.5 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98] group"
                >
                  <div className="w-9 h-9 rounded-[8px] bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <span className="font-black text-lg text-white tracking-wide">
                    Karyawan
                  </span>
                </Link>

                {/* Logout Button - Matching Figma Admin Card Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-[10px] flex items-center px-4 gap-3.5 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98] group disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-[8px] bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className="font-black text-lg text-white tracking-wide">
                    {isLoggingOut ? "Keluar..." : "Logout"}
                  </span>
                </button>
              </>
            ) : (
              <>
                {/* Fast Track Button - Figma Exact #37aee2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (onFastTrackClick) onFastTrackClick();
                  }}
                  className="w-full h-14 bg-[#37aee2] hover:bg-[#289ecf] text-white rounded-[10px] flex items-center px-4 gap-3.5 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98] group"
                >
                  <div className="w-9 h-9 rounded-[8px] bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                    <svg className="w-5 h-5 text-white -rotate-45 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </div>
                  <span className="font-black text-lg text-white tracking-wide">
                    Fast Track
                  </span>
                </button>

                {/* Admin Button - Figma Exact #ff8f00 */}
                <Link
                  href="/admin/login"
                  className="w-full h-14 bg-[#ff8f00] hover:bg-[#e68100] text-white rounded-[10px] flex items-center px-4 gap-3.5 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98] group"
                >
                  <div className="w-9 h-9 rounded-[8px] bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-45 transition-transform duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="font-black text-lg text-white tracking-wide">
                    Admin
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
