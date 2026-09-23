"use client";

import React from "react";
import type { PortalNotificationItem } from "./types";
import { PortalHeader } from "@/components/layout/PortalHeader";

export interface DashboardHeaderProps {
  onOpenSidebar: () => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  isDebouncing: boolean;
  notifications: PortalNotificationItem[];
  unreadIds: Set<string>;
  isRinging: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkAllRead: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenSidebar,
  searchInput,
  onSearchChange,
  onSearchClear,
  isDebouncing,
  notifications,
  unreadIds,
  isRinging,
  soundEnabled,
  onToggleSound,
  onMarkAllRead,
}) => {
  return (
    <PortalHeader
      title="Dashboard Pengajuan"
      onOpenSidebar={onOpenSidebar}
      search={{
        value: searchInput,
        onChange: onSearchChange,
        onClear: onSearchClear,
        isDebouncing,
        placeholder: "Search Content ...",
      }}
      notifications={notifications}
      unreadIds={unreadIds}
      isRinging={isRinging}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      onMarkAllRead={onMarkAllRead}
    />
  );
};
