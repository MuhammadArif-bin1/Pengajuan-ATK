"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PortalNotificationItem } from "@/components/dashboard/types";
import { playNotificationSound } from "@/lib/notificationSound";

export interface UsePortalNotificationsOptions {
  type?: "regular" | "purchase" | "all";
  limit?: number;
  pollingInterval?: number; // default 10000ms (10s)
  enableToastAlert?: (item: PortalNotificationItem) => void;
}

export function usePortalNotifications(options: UsePortalNotificationsOptions = {}) {
  const {
    type = "all",
    limit = 50,
    pollingInterval = 10000,
    enableToastAlert,
  } = options;

  const [notifications, setNotifications] = useState<PortalNotificationItem[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRinging, setIsRinging] = useState(false);
  const [livePopup, setLivePopup] = useState<PortalNotificationItem | null>(null);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const lastStatusesRef = useRef<Record<string, string>>({});
  const isInitialFetchRef = useRef(true);
  const isFetchingRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Load sound preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("portal_sound_enabled");
      if (stored !== null) {
        setSoundEnabled(stored === "true");
      }
    } catch {}
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const typeQuery = type !== "all" ? `&type=${type}` : "";
      const res = await fetch(
        `/api/requests/portal-notifications?limit=${limit}${typeQuery}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (!res.ok) return;

      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const items: PortalNotificationItem[] = json.data;
      setNotifications(items);

      let storedRead: string[] = [];
      try {
        const stored = localStorage.getItem("portal_read_notif_ids");
        if (stored) storedRead = JSON.parse(stored);
      } catch {}
      const readSet = new Set(storedRead);

      // Initial fetch: sync unread items with localStorage
      if (isInitialFetchRef.current) {
        const initialUnreads = items
          .filter((it) => !readSet.has(it.id))
          .map((it) => it.id);
        if (initialUnreads.length > 0) {
          setUnreadIds((prev) => new Set([...prev, ...initialUnreads]));
        }
      }

      // Subsequent polls: check for newly arrived requests OR status transitions
      if (!isInitialFetchRef.current) {
        let hasChange = false;
        let alertItem: PortalNotificationItem | null = null;

        // 1. Check for newly arrived requests (ID was not in knownIdsRef)
        const newItems = items.filter((item) => !knownIdsRef.current.has(item.id));
        if (newItems.length > 0) {
          hasChange = true;
          alertItem = newItems[0];
          const newUnreads = newItems.filter((it) => !readSet.has(it.id)).map((i) => i.id);
          if (newUnreads.length > 0) {
            setUnreadIds((prevSet) => new Set([...prevSet, ...newUnreads]));
          }
          if (enableToastAlert) {
            enableToastAlert(alertItem);
          }
        }

        // 2. Check for status transitions on existing items
        items.forEach((item) => {
          const prev = lastStatusesRef.current[item.id];
          if (prev && prev !== item.status) {
            hasChange = true;
            if (!alertItem) alertItem = item;
            setUnreadIds((prevSet) => new Set([...prevSet, item.id]));
            if (enableToastAlert && !newItems.some((n) => n.id === item.id)) {
              enableToastAlert(item);
            }
          }
        });

        // Trigger sound, bell ring animation, and floating live popup banner
        if (hasChange && alertItem) {
          if (soundEnabledRef.current) {
            playNotificationSound();
          }
          setIsRinging(true);
          setTimeout(() => setIsRinging(false), 2500);

          setLivePopup(alertItem);
          setTimeout(() => {
            setLivePopup((prev) => (prev?.id === alertItem?.id ? null : prev));
          }, 6000);

          // Desktop notification if supported & permitted
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`Pengajuan ATK: ${alertItem.itemName}`, {
              body: `${alertItem.userName} (${alertItem.department}) - Status: ${alertItem.status}`,
              icon: "/Image/logo/logo-bulat.png",
            });
          }
        }
      }

      // Update known IDs and last statuses
      knownIdsRef.current = new Set(items.map((it) => it.id));
      const statusMap: Record<string, string> = {};
      items.forEach((it) => {
        statusMap[it.id] = it.status;
      });
      lastStatusesRef.current = statusMap;
      isInitialFetchRef.current = false;
    } catch (err) {
      console.warn("usePortalNotifications error:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [type, limit, enableToastAlert]);

  // Mark all unread notifications as read
  const markAllRead = useCallback(() => {
    setUnreadIds(new Set());
    try {
      let storedRead: string[] = [];
      try {
        const stored = localStorage.getItem("portal_read_notif_ids");
        if (stored) storedRead = JSON.parse(stored);
      } catch {}
      const combined = Array.from(
        new Set([...storedRead, ...notifications.map((n) => n.id)])
      );
      localStorage.setItem("portal_read_notif_ids", JSON.stringify(combined));
    } catch {}
  }, [notifications]);

  // Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      let storedRead: string[] = [];
      try {
        const stored = localStorage.getItem("portal_read_notif_ids");
        if (stored) storedRead = JSON.parse(stored);
      } catch {}
      const combined = Array.from(new Set([...storedRead, id]));
      localStorage.setItem("portal_read_notif_ids", JSON.stringify(combined));
    } catch {}
  }, []);

  // Synchronize read status across multiple browser tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "portal_read_notif_ids" && e.newValue) {
        try {
          const readIds: string[] = JSON.parse(e.newValue);
          const readSet = new Set(readIds);
          setUnreadIds((prev) => {
            const next = new Set<string>();
            prev.forEach((id) => {
              if (!readSet.has(id)) next.add(id);
            });
            return next;
          });
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Smart Polling effect: only poll when tab is visible; immediately refresh on tab focus / visibility
  useEffect(() => {
    fetchNotifications();

    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchNotifications();
      }
    }, pollingInterval);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [fetchNotifications, pollingInterval]);

  const unreadCount = unreadIds.size;

  return {
    notifications,
    unreadIds,
    unreadCount,
    loading,
    soundEnabled,
    setSoundEnabled,
    toggleSound: () => {
      const next = !soundEnabled;
      setSoundEnabled(next);
      try {
        localStorage.setItem("portal_sound_enabled", String(next));
      } catch {}
      if (next) playNotificationSound();
    },
    isRinging,
    livePopup,
    dismissLivePopup: () => setLivePopup(null),
    markAllRead,
    markAsRead,
    refetch: fetchNotifications,
  };
}
