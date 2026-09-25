// ===========================================
// Request Helper Utilities
// ===========================================

export const PURCHASE_TAG = "[PENGAJUAN PEMBELIAN ATK BARU]";
export const FAST_TRACK_TAG = "[FAST TRACK]";

/**
 * Memeriksa apakah suatu pengajuan merupakan pengajuan pembelian ATK baru
 */
export function isPurchaseRequest(reason?: string | null): boolean {
  if (!reason) return false;
  return reason.includes(PURCHASE_TAG);
}

/**
 * Membersihkan format teks alasan dari tag sistem pembelian atau fast-track
 */
export function cleanPurchaseReason(rawReason?: string | null): string {
  if (!rawReason) return "-";
  const cleaned = rawReason
    .replace(PURCHASE_TAG, "")
    .replace(FAST_TRACK_TAG, "")
    .replace(/^Alasan:\s*/i, "")
    .trim();
  return cleaned || "-";
}

/**
 * Menyusun format alasan pengajuan pembelian baru yang terstandarisasi
 */
export function buildPurchaseReason(userReason?: string | null): string {
  const note = userReason?.trim()
    ? `Alasan: ${userReason.trim()}`
    : "Alasan: Permohonan pengadaan barang baru untuk operasional kantor";
  return [PURCHASE_TAG, note].join("\n");
}
