"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { usePortalNotifications } from "@/hooks/usePortalNotifications";
import { useToast } from "@/components/ui/Toast";
import type { AtkRequestData } from "@/types/request";
import { HistoryStatsCards } from "@/components/riwayat/HistoryStatsCards";
import {
  HistoryFilterBar,
  type DateMode,
  type SortOrder,
} from "@/components/riwayat/HistoryFilterBar";
import { HistoryTable } from "@/components/riwayat/HistoryTable";
import { HistoryDetailModal } from "@/components/riwayat/HistoryDetailModal";

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
  const [statsTotalRiwayat, setStatsTotalRiwayat] = useState(0);
  const [statsTotalQty, setStatsTotalQty] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "SELESAI" | "DITOLAK"
  const [dateMode, setDateMode] = useState<DateMode>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("NEWEST");

  // Modal Detail State
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(null);

  // Real-time toast alert callback
  const toastAlert = useCallback((item: any) => {
    if (item.status === "SELESAI") {
      toast.success(`🎉 Pengajuan Selesai: ${item.itemName} (${item.quantity} ${item.unit}) siap diambil`);
    } else if (item.status === "DITOLAK") {
      toast.error(`❌ Pengajuan Ditolak: ${item.itemName}`);
    } else if (item.status === "DIPROSES") {
      toast.info(`📋 Pengajuan ATK Masuk: ${item.itemName} (${item.quantity} ${item.unit})`);
    }
  }, [toast]);

  // Notifications State via Shared Hook
  const {
    notifications,
    unreadIds,
    unreadCount,
    isRinging,
    soundEnabled,
    toggleSound,
    livePopup,
    dismissLivePopup,
    markAllRead,
    markAsRead,
  } = usePortalNotifications({ limit: 20, enableToastAlert: toastAlert });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

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

  // Fetch requests (Khusus riwayat berkas: SELESAI & DITOLAK & type=regular)
  const fetchRequests = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        if (statusFilter === "ALL") {
          params.set("status", "SELESAI,DITOLAK");
        } else {
          params.set("status", statusFilter);
        }
        params.set("type", "regular");

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (departmentFilter) params.set("department", departmentFilter);
        if (computedStartDate) params.set("startDate", computedStartDate);
        if (computedEndDate) params.set("endDate", computedEndDate);

        const res = await fetch(`/api/requests?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil riwayat pengajuan");

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

        // Compute total quantity on current fetched list
        const qtySum = list.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
        setStatsTotalQty(qtySum);
        if (!debouncedSearch && !departmentFilter && dateMode === "all" && statusFilter === "ALL") {
          setStatsTotalRiwayat(data.total || 0);
        }
      } catch (err) {
        console.error("Fetch history requests error:", err);
        if (showLoading) toast.error("Gagal memuat riwayat pengajuan");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [page, debouncedSearch, departmentFilter, statusFilter, computedStartDate, computedEndDate, sortOrder, dateMode, toast]
  );

  // Initial load
  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDepartmentFilter("");
    setStatusFilter("ALL");
    setDateMode("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("NEWEST");
    setPage(1);
  };

  // Today completed/rejected count in current list
  const completedTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return requests.filter((r) => {
      const dateVal = (r.processedAt || r.updatedAt || r.createdAt)?.slice(0, 10);
      return dateVal === todayStr;
    }).length;
  }, [requests]);

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
        <PortalHeader
          title="Riwayat Pengajuan"
          onOpenSidebar={() => setSidebarOpen(true)}
          notifications={notifications}
          unreadIds={unreadIds}
          unreadCount={unreadCount}
          isRinging={isRinging}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onMarkAllRead={markAllRead}
          onMarkItemRead={markAsRead}
          livePopup={livePopup}
          onDismissLivePopup={dismissLivePopup}
        />

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* 3 Stat Summary Cards */}
          <HistoryStatsCards
            total={statsTotalRiwayat || total}
            completedTodayCount={completedTodayCount}
            totalQuantity={statsTotalQty}
          />

          {/* Filter Toolbar Card */}
          <HistoryFilterBar
            search={search}
            onSearchChange={setSearch}
            departments={departments}
            departmentFilter={departmentFilter}
            onDepartmentChange={(dept) => {
              setDepartmentFilter(dept);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(st) => {
              setStatusFilter(st);
              setPage(1);
            }}
            dateMode={dateMode}
            onDateModeChange={(mode) => {
              setDateMode(mode);
              setPage(1);
            }}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            onEndDateChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            debouncedSearch={debouncedSearch}
            onResetFilters={handleResetFilters}
          />

          {/* Main Table Card */}
          <HistoryTable
            requests={requests}
            total={total}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onSelectRequest={setSelectedRequest}
            isFiltered={Boolean(
              debouncedSearch ||
              departmentFilter ||
              statusFilter !== "ALL" ||
              dateMode !== "all"
            )}
            onResetFilters={handleResetFilters}
          />
        </main>
      </div>

      {/* Modal Detail Riwayat */}
      <HistoryDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
