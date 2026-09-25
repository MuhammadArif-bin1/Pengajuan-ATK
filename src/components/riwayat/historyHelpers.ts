// ===========================================
// Helper formatters for Riwayat ATK
// ===========================================

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (dateStr?: string | null): string => {
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

import { cleanPurchaseReason } from "@/lib/requestHelpers";

// Re-export as cleanReason for backwards compatibility
export const cleanReason = cleanPurchaseReason;
