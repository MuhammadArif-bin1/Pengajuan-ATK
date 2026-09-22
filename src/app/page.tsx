"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/components/ui/Toast";
import { playNotificationSound } from "@/lib/notificationSound";

// Modular Dashboard Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StockCatalogCard } from "@/components/dashboard/StockCatalogCard";
import { QueueListCard } from "@/components/dashboard/QueueListCard";
import { FastTrackModal } from "@/components/dashboard/FastTrackModal";
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
  const [notifications, setNotifications] = useState<PortalNotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Notification / Alert States
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRinging, setIsRinging] = useState(false);

  // Modals
  const [fastTrackOpen, setFastTrackOpen] = useState(false);
  const [pengajuanAtkOpen, setPengajuanAtkOpen] = useState(false);

  // References for Real-time Polling & Sound
  const lastStatusesRef = useRef<Record<string, string>>({});
  const isInitialFetchRef = useRef(true);

  // Purchase Badge Count calculation for Sidebar
  const purchaseCount = useMemo(() => {
    return notifications.filter((n) => n.isPurchase && n.status === "DIPROSES").length || 2;
  }, [notifications]);

  // 1.5s Debounce Effect
  useEffect(() => {
    if (searchInput !== debouncedSearch) {
      setIsDebouncing(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setIsDebouncing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

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

  // Fetch Requests Antrian & Notifications
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/portal-notifications?limit=100&_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const items: PortalNotificationItem[] = json.data;
      setNotifications(items);

      // On initial fetch, populate unread for Admin Decisions (SELESAI / DITOLAK)
      if (isInitialFetchRef.current) {
        let storedRead: string[] = [];
        try {
          const stored = localStorage.getItem("portal_read_notif_ids");
          if (stored) storedRead = JSON.parse(stored);
        } catch {}
        const readSet = new Set(storedRead);
        const initialUnreads = items
          .filter((it) => it.status !== "DIPROSES" && !readSet.has(it.id))
          .map((it) => it.id);
        if (initialUnreads.length > 0) {
          setUnreadIds((prev) => new Set([...prev, ...initialUnreads]));
        }
      }

      // Check for real-time status updates
      if (!isInitialFetchRef.current) {
        let hasChange = false;
        items.forEach((item) => {
          const prev = lastStatusesRef.current[item.id];
          if (prev && prev !== item.status) {
            hasChange = true;
            setUnreadIds((prevSet) => new Set([...prevSet, item.id]));
            if (item.status === "SELESAI") {
              toast.success(`🎉 Pengajuan Selesai: ${item.itemName} (${item.quantity} ${item.unit}) siap diambil`);
            } else if (item.status === "DITOLAK") {
              toast.error(`❌ Pengajuan Ditolak: ${item.itemName}`);
            } else if (item.status === "DIPROSES") {
              toast.info(`⚙️ Pengajuan Sedang Diproses: ${item.itemName}`);
            }
          }
        });

        if (hasChange) {
          if (soundEnabled) playNotificationSound();
          setIsRinging(true);
          setTimeout(() => setIsRinging(false), 2500);
        }
      }

      const statusMap: Record<string, string> = {};
      items.forEach((it) => {
        statusMap[it.id] = it.status;
      });
      lastStatusesRef.current = statusMap;
      isInitialFetchRef.current = false;
    } catch (err) {
      console.warn("Fetch requests error:", err);
    } finally {
      setNotificationsLoading(false);
    }
  }, [soundEnabled, toast]);

  useEffect(() => {
    fetchCatalog();
    fetchRequests();
    const interval = setInterval(() => {
      fetchRequests();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchCatalog, fetchRequests]);

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
  // Pengajuan yang statusnya telah SELESAI hanya muncul di antrian pada hari tersebut, dan hilang di hari berikutnya
  const filteredQueueItems = useMemo(() => {
    let list = notifications.filter((item) => {
      if (item.isPurchase) return false;

      // Status SELESAI hanya muncul pada hari tersebut
      if (item.status === "SELESAI") {
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
        onFastTrackClick={() => setFastTrackOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
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
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onMarkAllRead={() => setUnreadIds(new Set())}
        />

        {/* Active Search Filter Banner */}
        {debouncedSearch && (
          <div className="px-4 sm:px-8 pt-4">
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

        {/* Main 2-Column Dashboard Cards */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Column 1: Stok Barang ATK */}
            <StockCatalogCard
              items={filteredStockItems}
              loading={catalogLoading}
              statusFilter={stockStatusFilter}
              onStatusFilterChange={setStockStatusFilter}
              debouncedSearch={debouncedSearch}
            />

            {/* Column 2: Antrian Pengajuan */}
            <QueueListCard
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
        className="fixed bottom-8 right-8 z-30 w-14 h-14 bg-[#1d1633] hover:bg-[#2c224d] active:scale-95 text-white rounded-[19px] shadow-2xl flex items-center justify-center transition-all cursor-pointer group hover:shadow-indigo-950/30"
        title="Ajukan Pengajuan ATK Baru"
        aria-label="Tambah Pengajuan ATK"
      >
        <svg
          className="w-7 h-7 group-hover:scale-110 transition-transform"
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

      <FastTrackModal
        isOpen={fastTrackOpen}
        onClose={() => setFastTrackOpen(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
