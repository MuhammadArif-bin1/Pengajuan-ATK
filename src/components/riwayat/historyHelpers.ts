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

export const cleanReason = (rawReason?: string | null): string => {
  if (!rawReason) return "-";
  return (
    rawReason
      .replace("[PENGAJUAN PEMBELIAN ATK BARU]", "")
      .replace("[FAST TRACK]", "")
      .replace(/^Alasan:\s*/i, "")
      .trim() || "-"
  );
};
