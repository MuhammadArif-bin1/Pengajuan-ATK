"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { AtkRequestData } from "@/types/request";

export default function RiwayatPengajuanPage() {
  const toast = useToast();

  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data State
  const [requests, setRequests] = useState<AtkRequestData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Quick Stats
  const [statsTotalSelesai, setStatsTotalSelesai] = useState(0);
  const [statsTotalQty, setStatsTotalQty] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateMode, setDateMode] = useState<"all" | "today" | "month" | "year" | "range">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");

  // Modal Detail State
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);

  // Notifications State (for top navbar bell)
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Click outside to close notif dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/users/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  // Fetch notifications
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/portal-notifications?limit=20&_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifications(json.data);
          const unread = json.data.filter((n: any) => n.status !== "DIPROSES").length;
          setUnreadCount(unread);
        }
      }
    } catch {}
  }, []);

  // Compute calculated dates based on dateMode
  const { computedStartDate, computedEndDate } = useMemo(() => {
    const now = new Date();
    if (dateMode === "today") {
      const todayStr = now.toISOString().slice(0, 10);
      return { computedStartDate: todayStr, computedEndDate: todayStr };
    }
    if (dateMode === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      return { computedStartDate: start, computedEndDate: end };
    }
    if (dateMode === "year") {
      const start = `${now.getFullYear()}-01-01`;
      const end = `${now.getFullYear()}-12-31`;
      return { computedStartDate: start, computedEndDate: end };
    }
    if (dateMode === "range") {
      return { computedStartDate: startDate, computedEndDate: endDate };
    }
    return { computedStartDate: "", computedEndDate: "" };
  }, [dateMode, startDate, endDate]);

  // Fetch requests (Khusus status=SELESAI & type=regular)
  const fetchRequests = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        params.set("status", "SELESAI");
        params.set("type", "regular");

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (departmentFilter) params.set("department", departmentFilter);
        if (computedStartDate) params.set("startDate", computedStartDate);
        if (computedEndDate) params.set("endDate", computedEndDate);

        const res = await fetch(`/api/requests?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil riwayat pengajuan selesai");

        const data = await res.json();
        let list: AtkRequestData[] = data.data || [];

        // Apply client sort if oldest is selected
        if (sortOrder === "OLDEST") {
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        setRequests(list);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);

        // Compute total quantity on current fetched list or overall
        const qtySum = list.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
        setStatsTotalQty(qtySum);
        if (!debouncedSearch && !departmentFilter && dateMode === "all") {
          setStatsTotalSelesai(data.total || 0);
        }
      } catch (err) {
        console.error("Fetch history requests error:", err);
        if (showLoading) toast.error("Gagal memuat riwayat pengajuan");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [page, debouncedSearch, departmentFilter, computedStartDate, computedEndDate, sortOrder, dateMode, toast]
  );

  // Initial load
  useEffect(() => {
    fetchDepartments();
    fetchNotifs();
  }, [fetchNotifs]);

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDepartmentFilter("");
    setDateMode("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("NEWEST");
    setPage(1);
  };

  // Format Helpers
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Today completed count in current list
  const completedTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return requests.filter((r) => {
      const dateVal = (r.processedAt || r.updatedAt || r.createdAt)?.slice(0, 10);
      return dateVal === todayStr;
    }).length;
  }, [requests]);

  // Clean Reason helper
  const cleanReason = (rawReason?: string | null) => {
    if (!rawReason) return "-";
    return rawReason
      .replace("[PENGAJUAN PEMBELIAN ATK BARU]", "")
      .replace("[FAST TRACK]", "")
      .replace(/^Alasan:\s*/i, "")
      .trim() || "-";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        role="PUBLIC"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab="history"
        purchaseBadgeCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 print:pl-0">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 shadow-xs print:hidden">
          {/* Left: Mobile Menu Trigger & Page Title */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Buka Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#323c4d] tracking-tight">
                Riwayat Pengajuan Selesai
              </h1>
            </div>
          </div>

          {/* Right: Quick Links & Notification Bell */}
          <div className="flex items-center gap-3 relative" ref={notifDropdownRef}>
            <button
              type="button"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#ff8f00] hover:bg-orange-50 transition cursor-pointer relative shadow-2xs border border-orange-100"
              aria-label="Notifikasi Pengajuan"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#dc2626] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <span className="font-bold text-slate-800 text-sm">Notifikasi Pengajuan</span>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    {soundEnabled ? "🔔 Suara Aktif" : "🔕 Mute"}
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                  {notifications.slice(0, 8).map((notif) => (
                    <div key={notif.id} className="p-3 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{notif.itemName}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {notif.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Pemohon: {notif.userName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* 3 Stat Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
            {/* Stat 1: Total Selesai */}
            <div className="bg-white rounded-[10px] border border-[#ebeef2] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[#606c80] text-[11px] font-bold uppercase tracking-wider">
                <span>TOTAL RIWAYAT</span>
                <span className="w-7 h-7 rounded-[6px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  ✔
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-[#323c4d] tracking-tight">
                  {statsTotalSelesai || total}
                </span>
                <span className="text-xs font-semibold text-slate-400 ml-1.5">Berkas</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Permohonan selesai secara keseluruhan
              </p>
            </div>

            {/* Stat 2: Diselesaikan Hari Ini */}
            <div className="bg-white rounded-[10px] border border-[#ebeef2] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[#606c80] text-[11px] font-bold uppercase tracking-wider">
                <span>SELESAI HARI INI</span>
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
                  {statsTotalQty}
                </span>
                <span className="text-xs font-semibold text-slate-400 ml-1.5">Unit</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Kuantitas barang dalam daftar ini
              </p>
            </div>
          </div>

          {/* Filter Toolbar Card */}
          <div className="bg-white rounded-[12px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-4 sm:p-6 space-y-4 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Search Bar */}
              <div className="md:col-span-5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama pemohon, divisi, nama barang..."
                  className="w-full pl-10 pr-9 h-[42px] rounded-[8px] border border-[#ebeef2] bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ff8f00] focus:ring-1 focus:ring-[#ff8f00] transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Departemen Filter */}
              <div className="md:col-span-3">
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-[42px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#ff8f00] focus:ring-1 focus:ring-[#ff8f00] transition cursor-pointer"
                >
                  <option value="">Semua Departemen</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Periode Waktu Select */}
              <div className="md:col-span-2">
                <select
                  value={dateMode}
                  onChange={(e) => {
                    setDateMode(e.target.value as any);
                    setPage(1);
                  }}
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
                  onChange={(e) => setSortOrder(e.target.value as any)}
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
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#ff8f00]"
                />
                <span className="text-xs font-bold text-slate-600">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] rounded-[8px] border border-[#ebeef2] bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#ff8f00]"
                />
              </div>
            )}

            {/* Active Filter summary & Reset Button */}
            {(debouncedSearch || departmentFilter || dateMode !== "all" || sortOrder !== "NEWEST") && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Filter aktif:{" "}
                  {debouncedSearch && <b className="text-slate-800 mr-2">Cari: "{debouncedSearch}"</b>}
                  {departmentFilter && <b className="text-slate-800 mr-2">Divisi: {departmentFilter}</b>}
                  {dateMode !== "all" && <b className="text-slate-800 mr-2">Periode: {dateMode}</b>}
                  {sortOrder === "OLDEST" && <b className="text-slate-800">Urutan Terlama</b>}
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-[#ff8f00] hover:text-[#e07d00] transition cursor-pointer hover:underline"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-[12px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] overflow-hidden">
            {/* Table Header Details */}
            <div className="px-5 sm:px-6 py-4 border-b border-[#ebeef2] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#323c4d] tracking-tight">
                  Daftar Berkas Selesai
                </h3>
                <p className="text-xs text-[#606c80] font-medium mt-0.5">
                  Menampilkan {requests.length} dari total {total} berkas selesai
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

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Status: Selesai
                </span>
              </div>
            </div>

            {/* Content Rendering */}
            {loading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-3 border-[#ff8f00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500">Memuat riwayat pengajuan selesai...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-2xl shadow-2xs">
                  📂
                </div>
                <h4 className="text-sm font-bold text-slate-700">Belum ada data riwayat selesai</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {debouncedSearch || departmentFilter || dateMode !== "all"
                    ? "Tidak ada permohonan selesai yang sesuai dengan filter pencarian Anda."
                    : "Pengajuan ATK yang telah selesai diproses oleh administrator akan secara otomatis diarsipkan di sini."}
                </p>
                {(debouncedSearch || departmentFilter || dateMode !== "all") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
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
                      <th className="text-left px-5 py-3.5">TGL SELESAI</th>
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
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Selesai
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right print:hidden">
                            <button
                              type="button"
                              onClick={() => setSelectedRequest(req)}
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-[8px] border border-[#ebeef2] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-bold"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-[8px] border border-[#ebeef2] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-bold"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL: DETAIL RIWAYAT PENGAJUAN SELESAI
      ══════════════════════════════════════════════════════ */}
      {selectedRequest && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          title="Detail Berkas Pengajuan Selesai"
          subtitle={`Tiket #${selectedRequest.id.slice(-8).toUpperCase()} • ${selectedRequest.user.name}`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-slate-500">
                Diselesaikan: {formatDate(selectedRequest.processedAt || selectedRequest.updatedAt)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[8px] transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          }
        >
          <div className="space-y-4 py-1 text-xs">
            {/* Status Header Box */}
            <div className="p-3.5 rounded-[10px] bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-bold text-emerald-900 text-xs">Pengajuan Telah Selesai</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Barang ATK telah diserahkan kepada pemohon
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                SELESAI
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-[10px] bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Nama Pemohon
                </span>
                <span className="text-xs font-black text-slate-900 block">
                  {selectedRequest.user.name}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Departemen / Jabatan
                </span>
                <span className="text-xs font-bold text-slate-800 block">
                  {selectedRequest.user.department} • {selectedRequest.user.position}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Barang ATK
                </span>
                <span className="text-xs font-black text-[#ff8f00] block">
                  {selectedRequest.atkItem.name}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Jumlah Diserahkan
                </span>
                <span className="text-xs font-black text-slate-900 block">
                  {selectedRequest.quantity} {selectedRequest.atkItem.unit}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Waktu Pengajuan
                </span>
                <span className="text-xs font-semibold text-slate-700 block">
                  {formatDateTime(selectedRequest.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Waktu Diselesaikan
                </span>
                <span className="text-xs font-semibold text-slate-700 block">
                  {formatDateTime(selectedRequest.processedAt || selectedRequest.updatedAt)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Diproses / Disetujui Oleh
                </span>
                <span className="text-xs font-bold text-slate-800 block">
                  {selectedRequest.processor?.name || "Administrator"}
                </span>
              </div>
            </div>

            {/* Reason & Admin Note */}
            {selectedRequest.reason && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Keterangan / Alasan Pengajuan:
                </span>
                <div className="p-3 rounded-[8px] bg-white border border-slate-200 text-slate-700 leading-relaxed text-[11.5px]">
                  {cleanReason(selectedRequest.reason)}
                </div>
              </div>
            )}

            {selectedRequest.adminNote && (
              <div>
                <span className="text-xs font-bold text-amber-800 block mb-1">
                  Catatan dari Administrator:
                </span>
                <div className="p-3 rounded-[8px] bg-amber-50/80 border border-amber-200 text-amber-900 leading-relaxed text-[11.5px]">
                  {selectedRequest.adminNote}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
