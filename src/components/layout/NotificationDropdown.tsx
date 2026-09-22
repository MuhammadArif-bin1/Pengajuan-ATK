"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { playNotificationSound } from "@/lib/notificationSound";

export interface NotificationItem {
  id: string;
  type: "regular" | "purchase";
  typeLabel: string;
  userName: string;
  department: string;
  position: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  status: string;
  createdAt: string;
  targetUrl: string;
}

export const NotificationDropdown: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "regular" | "purchase">("all");
  const [livePopup, setLivePopup] = useState<NotificationItem | null>(null);
  const [isRinging, setIsRinging] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const isFetchingRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Load readIds & sound preferences from localStorage on mount
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem("admin_read_notifications_v1");
      if (storedRead) {
        setReadIds(new Set(JSON.parse(storedRead)));
      }
      const storedSound = localStorage.getItem("admin_sound_enabled");
      if (storedSound !== null) {
        setSoundEnabled(storedSound === "true");
      }
    } catch (e) {
      console.error("Failed to load notification storage", e);
    }
  }, []);

  // Request browser desktop notification permission if supported
  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    // Prevent overlapping fetches (e.g. during slow networks or initial compilation)
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return;

      const incomingList: NotificationItem[] = data.data;

      // Check if there are newly arrived requests
      if (!isInitialLoadRef.current && incomingList.length > 0) {
        const newest = incomingList[0];
        if (!knownIdsRef.current.has(newest.id)) {
          // Play sound
          if (soundEnabledRef.current) {
            playNotificationSound();
          }

          // Trigger ringing animation on bell
          setIsRinging(true);
          setTimeout(() => setIsRinging(false), 2500);

          // Show floating popup banner
          setLivePopup(newest);

          // Trigger Desktop OS Notification
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`Pengajuan Baru: ${newest.itemName}`, {
              body: `${newest.userName} (${newest.department}) mengajukan ${newest.quantity} ${newest.unit} ${newest.typeLabel}`,
              icon: "/Image/logo/logo-bulat.png",
            });
          }
        }
      }

      // Update known IDs
      const currentIdSet = new Set(incomingList.map((n) => n.id));
      knownIdsRef.current = currentIdSet;
      isInitialLoadRef.current = false;

      setNotifications(incomingList);
    } catch {
      // Quietly ignore transient network issues or compilation pauses during development
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Safe background auto-refresh every 15s (only when tab is visible) + on window focus
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    }, 15000);

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single item as read
  const handleMarkAsRead = (id: string, targetUrl: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    try {
      localStorage.setItem("admin_read_notifications_v1", JSON.stringify(Array.from(updated)));
    } catch (e) {
      console.error("Storage save error", e);
    }
    setIsOpen(false);
    router.push(targetUrl);
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    const allIds = new Set([...Array.from(readIds), ...notifications.map((n) => n.id)]);
    setReadIds(allIds);
    try {
      localStorage.setItem("admin_read_notifications_v1", JSON.stringify(Array.from(allIds)));
    } catch (e) {
      console.error("Storage save error", e);
    }
  };

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("admin_sound_enabled", String(next));
    if (next) {
      playNotificationSound();
    }
  };

  // Calculate unread items
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  // Filtered notifications list
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "regular") return n.type === "regular";
    if (activeFilter === "purchase") return n.type === "purchase";
    return true;
  });

  // Relative time helper
  const getRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Baru saja";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} mnt lalu`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} jam lalu`;
    const day = Math.floor(hour / 24);
    if (day < 7) return `${day} hari lalu`;
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button matching User Navbar */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            requestDesktopPermission();
          }}
          className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-[#ff8f00] hover:bg-orange-50 transition cursor-pointer relative shadow-2xs border border-orange-100 ${
            isOpen ? "bg-orange-50" : "bg-white"
          }`}
          title="Notifikasi Realtime"
          aria-label="Notifikasi Realtime"
        >
          <svg
            className={`w-6 h-6 transition-transform ${
              isRinging ? "animate-bounce text-amber-600" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
          </svg>

          {/* Unread Badge Counter */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#dc2626] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Mobile Backdrop Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-2xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* ─── DROPDOWN PANEL ─── */}
        {isOpen && (
          <div className="fixed inset-x-3.5 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-full sm:max-w-md bg-white rounded-[10px] shadow-xl border border-[#ebeef2] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wide">
                  Aktivitas Pengajuan Realtime
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="p-1 rounded-[6px] text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title={soundEnabled ? "Suara notifikasi aktif" : "Suara dinonaktifkan"}
                >
                  {soundEnabled ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  )}
                </button>

                {/* Mark All As Read */}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-[#ff8f00] hover:text-orange-400 font-semibold cursor-pointer"
                  >
                    Tandai Dibaca
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-[#ebeef2] bg-slate-50/70 p-1.5 gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`flex-1 py-1 px-2 rounded-[6px] transition ${
                  activeFilter === "all"
                    ? "bg-white text-[#323c4d] shadow-2xs border border-[#ebeef2]"
                    : "text-[#606c80] hover:text-[#323c4d]"
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("regular")}
                className={`flex-1 py-1 px-2 rounded-[6px] transition ${
                  activeFilter === "regular"
                    ? "bg-white text-[#ff8f00] shadow-2xs border border-[#ebeef2]"
                    : "text-[#606c80] hover:text-[#323c4d]"
                }`}
              >
                Permintaan ATK
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("purchase")}
                className={`flex-1 py-1 px-2 rounded-[6px] transition ${
                  activeFilter === "purchase"
                    ? "bg-white text-purple-600 shadow-2xs border border-[#ebeef2]"
                    : "text-[#606c80] hover:text-[#323c4d]"
                }`}
              >
                Pembelian ATK
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#ebeef2]">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-[#606c80]">
                  <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-xs font-semibold text-[#323c4d]">Belum ada pengajuan baru</p>
                  <p className="text-[10px] text-[#606c80] mt-0.5">Sistem memantau permohonan secara realtime</p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isUnread = !readIds.has(item.id);
                  const isPurchase = item.type === "purchase";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMarkAsRead(item.id, item.targetUrl)}
                      className={`w-full text-left p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 cursor-pointer ${
                        isUnread ? "bg-orange-50/25" : "bg-white"
                      }`}
                    >
                      {/* Indicator Icon */}
                      <div
                        className={`w-8 h-8 rounded-[6px] shrink-0 flex items-center justify-center text-xs font-bold ${
                          isPurchase
                            ? "bg-purple-100 text-purple-700"
                            : "bg-orange-100 text-[#ff8f00]"
                        }`}
                      >
                        {isPurchase ? "🛍️" : "📦"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-[4px] tracking-wide ${
                              isPurchase
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-orange-50 text-[#ff8f00] border border-orange-200"
                            }`}
                          >
                            {isPurchase ? "Pembelian ATK" : "Permintaan ATK"}
                          </span>
                          <span className="text-[10px] text-[#606c80] font-medium whitespace-nowrap">
                            {getRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-[#323c4d] truncate">
                          {item.userName}{" "}
                          <span className="text-[11px] font-normal text-[#606c80]">
                            ({item.department})
                          </span>
                        </p>

                        <p className="text-xs text-[#323c4d] mt-0.5">
                          Mengajukan:{" "}
                          <span className="font-bold text-[#323c4d]">
                            {item.itemName}
                          </span>{" "}
                          <span className="text-[#ff8f00] font-bold">
                            ({item.quantity} {item.unit})
                          </span>
                        </p>

                        {item.reason && (
                          <p className="text-[11px] text-[#606c80] line-clamp-1 italic mt-0.5">
                            "{item.reason}"
                          </p>
                        )}
                      </div>

                      {/* Unread indicator dot */}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#ff8f00] shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Quick Links */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-[#ebeef2] flex items-center justify-between text-xs font-bold">
              <Link
                href="/admin/pengajuan"
                onClick={() => setIsOpen(false)}
                className="text-[#ff8f00] hover:underline"
              >
                Permintaan ATK →
              </Link>
              <Link
                href="/admin/barang"
                onClick={() => setIsOpen(false)}
                className="text-purple-600 hover:underline"
              >
                Pembelian ATK →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── FLOATING LIVE ALERT TOAST (Top Right / Mobile Responsive) ─── */}
      {livePopup && (
        <div className="fixed top-20 inset-x-3.5 sm:inset-x-auto sm:right-6 z-50 max-w-sm w-auto sm:w-full bg-white rounded-[10px] shadow-xl border border-[#ff8f00] p-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[8px] bg-orange-50 text-[#ff8f00] border border-orange-200 flex items-center justify-center shrink-0 font-bold text-lg animate-bounce">
                🔔
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#ff8f00] uppercase tracking-wider block">
                  Pengajuan Baru Masuk!
                </span>
                <p className="text-xs font-bold text-[#323c4d] mt-0.5">
                  {livePopup.userName} ({livePopup.department})
                </p>
                <p className="text-xs text-[#606c80] mt-0.5">
                  {livePopup.typeLabel}:{" "}
                  <b className="text-[#323c4d]">{livePopup.itemName}</b> (
                  {livePopup.quantity} {livePopup.unit})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLivePopup(null)}
              className="text-[#606c80] hover:text-[#323c4d] text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#ebeef2] flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#606c80] font-medium">
              Baru saja diterima
            </span>
            <button
              type="button"
              onClick={() => {
                const target = livePopup.targetUrl;
                setLivePopup(null);
                handleMarkAsRead(livePopup.id, target);
              }}
              className="px-3 py-1.5 bg-[#ff8f00] hover:bg-orange-600 text-white text-xs font-bold rounded-[8px] transition shadow-2xs cursor-pointer"
            >
              Periksa Pengajuan →
            </button>
          </div>
        </div>
      )}
    </>
  );
};
