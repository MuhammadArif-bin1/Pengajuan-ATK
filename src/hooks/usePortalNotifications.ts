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

  const lastStatusesRef = useRef<Record<string, string>>({});
  const isInitialFetchRef = useRef(true);
  const isFetchingRef = useRef(false);

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

      // Initial fetch: sync unread items with localStorage
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

      // Subsequent polls: check for status transitions
      if (!isInitialFetchRef.current) {
        let hasChange = false;
        items.forEach((item) => {
          const prev = lastStatusesRef.current[item.id];
          if (prev && prev !== item.status) {
            hasChange = true;
            setUnreadIds((prevSet) => new Set([...prevSet, item.id]));
            if (enableToastAlert) {
              enableToastAlert(item);
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
      console.warn("usePortalNotifications error:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [type, limit, soundEnabled, enableToastAlert]);

  // Mark all unread notifications as read
  const markAllRead = useCallback(() => {
    setUnreadIds(new Set());
    try {
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem("portal_read_notif_ids", JSON.stringify(allIds));
    } catch {}
  }, [notifications]);

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

  const unreadCount = unreadIds.size > 0 
    ? unreadIds.size 
    : notifications.filter((n) => n.status !== "DIPROSES").length;

  return {
    notifications,
    unreadIds,
    unreadCount,
    loading,
    soundEnabled,
    setSoundEnabled,
    toggleSound: () => setSoundEnabled((prev) => !prev),
    isRinging,
    markAllRead,
    refetch: fetchNotifications,
  };
}
