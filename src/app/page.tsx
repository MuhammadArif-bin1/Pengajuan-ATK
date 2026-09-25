"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/components/ui/Toast";
import { usePortalNotifications } from "@/hooks/usePortalNotifications";

// Modular Dashboard Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StockCatalogCard } from "@/components/dashboard/StockCatalogCard";
import { QueueListCard } from "@/components/dashboard/QueueListCard";
import { PengajuanAtkModal } from "@/components/dashboard/PengajuanAtkModal";
import type {
  AtkCatalogItem,
  PortalNotificationItem,
  StockStatusFilter,
  QueueSortOrder,
} from "@/components/dashboard/types";

export default function DashboardPengajuanPage() {
  const toast = useToast();

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search State with 1.5s Debounce
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Filter & Sort States
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>("ALL");
  const [queueSortOrder, setQueueSortOrder] = useState<QueueSortOrder>("NEWEST");

  // Data States
  const [catalogItems, setCatalogItems] = useState<AtkCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  // Modals
  const [pengajuanAtkOpen, setPengajuanAtkOpen] = useState(false);

  // Real-time Notifications & Queue State via Shared Hook
  const toastAlert = useCallback((item: PortalNotificationItem) => {
    if (item.status === "SELESAI") {
      toast.success(`🎉 Pengajuan Selesai: ${item.itemName} (${item.quantity} ${item.unit}) siap diambil`);
    } else if (item.status === "DITOLAK") {
      toast.error(`❌ Pengajuan Ditolak: ${item.itemName}`);
    } else if (item.status === "DIPROSES") {
      toast.info(`📋 Pengajuan ATK Masuk: ${item.itemName} (${item.quantity} ${item.unit}) oleh ${item.userName}`);
    }
  }, [toast]);

  const {
    notifications,
    unreadIds,
    loading: notificationsLoading,
    soundEnabled,
    toggleSound,
    isRinging,
    livePopup,
    dismissLivePopup,
    markAllRead,
    markAsRead,
    refetch: fetchRequests,
  } = usePortalNotifications({
    limit: 100,
    enableToastAlert: toastAlert,
  });

  // Purchase Badge Count calculation for Sidebar
  const purchaseCount = useMemo(() => {
    return notifications.filter((n) => n.isPurchase && n.status === "DIPROSES").length || 2;
  }, [notifications]);

  // Fetch ATK Catalog
  const fetchCatalog = useCallback(async () => {
    try {
      setCatalogLoading(true);
      const res = await fetch("/api/atk?activeOnly=true&_t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setCatalogItems(json.data || []);
      }
    } catch (e) {
      console.warn("Fetch catalog error:", e);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  // Periodic Catalog Refresh (60s interval or on window focus)
  useEffect(() => {
    fetchCatalog();

    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchCatalog();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchCatalog();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [fetchCatalog]);

  // Filtered Stock Items (Debounced Search & Status Filter)
  const filteredStockItems = useMemo(() => {
    return catalogItems.filter((item) => {
      // Status filter
      if (stockStatusFilter === "READY" && item.stock <= 5) return false;
      if (stockStatusFilter === "LOW" && (item.stock <= 0 || item.stock > 5)) return false;
      if (stockStatusFilter === "EMPTY" && item.stock !== 0) return false;

      // Debounced search query
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        const matchUnit = item.unit?.toLowerCase().includes(q) || false;
        let matchStatus = false;
        if (q === "tersedia" && item.stock > 5) matchStatus = true;
        if (q === "menipis" && item.stock > 0 && item.stock <= 5) matchStatus = true;
        if (q === "kosong" && item.stock === 0) matchStatus = true;

        return matchName || matchDesc || matchUnit || matchStatus;
      }

      return true;
    });
  }, [catalogItems, stockStatusFilter, debouncedSearch]);

  // Filtered & Sorted Queue Items (Hanya permohonan ATK reguler, bukan pengajuan pembelian)
  // Pengajuan yang statusnya telah SELESAI atau DITOLAK hanya muncul di antrian pada hari tersebut, dan hilang di hari berikutnya
  const filteredQueueItems = useMemo(() => {
    let list = notifications.filter((item) => {
      if (item.isPurchase) return false;

      // Status SELESAI dan DITOLAK hanya muncul pada hari tersebut
      if (item.status === "SELESAI" || item.status === "DITOLAK") {
        const completionDateStr = item.processedAt || item.updatedAt || item.createdAt;
        if (completionDateStr) {
          const compDate = new Date(completionDateStr);
          const now = new Date();
          const isToday =
            compDate.getFullYear() === now.getFullYear() &&
            compDate.getMonth() === now.getMonth() &&
            compDate.getDate() === now.getDate();
          if (!isToday) return false;
        }
      }

      return true;
    });

    // Debounced search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((item) => {
        const matchUser = item.userName.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        const matchItem = item.itemName.toLowerCase().includes(q);
        const matchReason = item.reason.toLowerCase().includes(q);
        const matchStatus = item.status.toLowerCase().includes(q);
        const matchNote = item.adminNote?.toLowerCase().includes(q) || false;

        return matchUser || matchDept || matchItem || matchReason || matchStatus || matchNote;
      });
    }

    // Sort Order
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return queueSortOrder === "NEWEST" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [notifications, debouncedSearch, queueSortOrder]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        role="PUBLIC"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === "history") {
            toast.info("Riwayat pengajuan dapat dilihat langsung pada antrian terarsip.");
          }
        }}
        purchaseBadgeCount={purchaseCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <DashboardHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onSearchClear={() => {
            setSearchInput("");
            setDebouncedSearch("");
          }}
          isDebouncing={isDebouncing}
          notifications={notifications}
          unreadIds={unreadIds}
          isRinging={isRinging}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onMarkAllRead={markAllRead}
          onMarkItemRead={markAsRead}
          livePopup={livePopup}
          onDismissLivePopup={dismissLivePopup}
        />

        {/* Active Search Filter Banner */}
        {debouncedSearch && (
          <div className="px-4 sm:px-8 pt-4 shrink-0">
            <div className="bg-orange-50 border border-orange-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-orange-900">
              <div className="flex items-center gap-2">
                <span className="font-bold">🔍 Hasil Pencarian:</span>
                <span className="font-semibold px-2 py-0.5 rounded-lg bg-white border border-orange-200">
                  &ldquo;{debouncedSearch}&rdquo;
                </span>
                <span className="text-slate-500">
                  ({filteredStockItems.length} barang ATK, {filteredQueueItems.length} antrian)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                }}
                className="font-bold text-xs text-[#ff8f00] hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Main 2-Column Dashboard Cards (Stok: +20% / 60%, Antrian: -20% / 40%) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch flex-1 min-h-0">
            {/* Column 1: Stok Barang ATK (diperbesar 20% -> 60% / 3 dari 5 kolom) */}
            <StockCatalogCard
              className="lg:col-span-3"
              items={filteredStockItems}
              loading={catalogLoading}
              statusFilter={stockStatusFilter}
              onStatusFilterChange={setStockStatusFilter}
              debouncedSearch={debouncedSearch}
            />

            {/* Column 2: Antrian Pengajuan (diperkecil 20% -> 40% / 2 dari 5 kolom) */}
            <QueueListCard
              className="lg:col-span-2"
              items={filteredQueueItems}
              loading={notificationsLoading}
              sortOrder={queueSortOrder}
              onSortOrderChange={setQueueSortOrder}
              debouncedSearch={debouncedSearch}
            />
          </div>
        </main>
      </div>

      {/* Floating Action Button (+) Pengajuan ATK Baru di Halaman Utama */}
      <button
        type="button"
        onClick={() => setPengajuanAtkOpen(true)}
        className="fixed bottom-8 right-8 z-30 w-[84px] h-[84px] bg-[#1d1633] hover:bg-[#2c224d] active:scale-95 text-white rounded-[28px] shadow-2xl flex items-center justify-center transition-all cursor-pointer group hover:shadow-indigo-950/30"
        title="Ajukan Pengajuan ATK Baru"
        aria-label="Tambah Pengajuan ATK"
      >
        <svg
          className="w-[42px] h-[42px] group-hover:scale-110 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}
      {/* Floating Form Card: Pengajuan ATK */}
      <PengajuanAtkModal
        isOpen={pengajuanAtkOpen}
        onClose={() => setPengajuanAtkOpen(false)}
        catalogItems={catalogItems}
        onSuccess={() => {
          fetchRequests();
          fetchCatalog();
        }}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
