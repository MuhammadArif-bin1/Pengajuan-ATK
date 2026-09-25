import { isPurchaseRequest, cleanPurchaseReason } from "@/lib/requestHelpers";

export interface ReportTransactionExport {
  id: string;
  createdAt: string;
  type: "purchase" | "regular";
  user: {
    name: string;
    department: string;
    position?: string;
    email?: string;
  };
  atkItem: {
    name: string;
    unit?: string;
  };
  quantity: number;
  status: string;
  reason?: string;
  adminNote?: string;
}

export interface DepartmentSummaryExport {
  department: string;
  total: number;
  diproses?: number;
  selesai?: number;
  ditolak?: number;
  approved?: number;
  inProgress?: number;
  rejected?: number;
}

export interface ItemSummaryExport {
  name: string;
  total: number;
  quantity: number;
  unit: string;
}

/**
 * Escapes CSV cell value according to RFC 4180
 */
function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.includes(";")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function exportReportToCsv(params: {
  transactions: ReportTransactionExport[];
  departmentSummary: DepartmentSummaryExport[];
  itemSummary: ItemSummaryExport[];
  filterInfo: {
    startDate?: string;
    endDate?: string;
    department?: string;
    type?: string;
  };
}) {
  const { transactions, departmentSummary, itemSummary, filterInfo } = params;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch {
      return dateStr;
    }
  };

  const periodText =
    filterInfo.startDate || filterInfo.endDate
      ? `${filterInfo.startDate || "Awal"} s/d ${filterInfo.endDate || "Sekarang"}`
      : "Semua Periode";

  const categoryText =
    filterInfo.type === "purchase"
      ? "Pengajuan Pembelian ATK Saja"
      : filterInfo.type === "regular"
      ? "Permintaan ATK Gudang Saja"
      : "Semua Kategori (Permintaan & Pembelian)";

  const departmentText = filterInfo.department || "Semua Departemen";
  
  const now = new Date();
  const printedAt = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }) + ` ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;

  const lines: string[] = [];

  // ══════════════════════════════════════════════════════════════════
  // HEADER UTAMA PERUSAHAAN & LAPORAN
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("LAPORAN REKAPITULASI PENGAJUAN ALAT TULIS KANTOR (ATK)")].join(","));
  lines.push([escapeCsv("PT HASAMITRAJABAR - SISTEM INFORMASI PENGELOLAAN ATK")].join(","));
  lines.push("");

  // Metadata / Parameter Filter
  lines.push([escapeCsv("INFORMASI & FILTER LAPORAN")].join(","));
  lines.push([escapeCsv("Periode Tanggal"), escapeCsv(periodText)].join(","));
  lines.push([escapeCsv("Kategori Pengajuan"), escapeCsv(categoryText)].join(","));
  lines.push([escapeCsv("Departemen / Divisi"), escapeCsv(departmentText)].join(","));
  lines.push([escapeCsv("Waktu Cetak / Unduh"), escapeCsv(printedAt)].join(","));
  lines.push([escapeCsv("Total Transaksi Masuk"), escapeCsv(`${transactions.length} Berkas`)].join(","));
  lines.push("");

  // ══════════════════════════════════════════════════════════════════
  // TABEL 1: RINCIAN TRANSAKSI PENGAJUAN
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("1. DAFTAR RINCIAN TRANSAKSI PENGAJUAN ATK")].join(","));
  lines.push(
    [
      escapeCsv("No"),
      escapeCsv("Tanggal Pengajuan"),
      escapeCsv("Jenis Pengajuan"),
      escapeCsv("Nama Pemohon"),
      escapeCsv("Departemen"),
      escapeCsv("Jabatan"),
      escapeCsv("Nama Barang ATK"),
      escapeCsv("Jumlah"),
      escapeCsv("Satuan"),
      escapeCsv("Status"),
      escapeCsv("Alasan / Keterangan"),
      escapeCsv("Catatan Admin"),
    ].join(",")
  );

  transactions.forEach((tx, idx) => {
    const isPurchase = tx.type === "purchase" || isPurchaseRequest(tx.reason);
    const cleanReason = cleanPurchaseReason(tx.reason);

    lines.push(
      [
        escapeCsv(idx + 1),
        escapeCsv(formatDate(tx.createdAt)),
        escapeCsv(isPurchase ? "Pengajuan Pembelian ATK" : "Permintaan ATK Gudang"),
        escapeCsv(tx.user?.name || "-"),
        escapeCsv(tx.user?.department || "-"),
        escapeCsv(tx.user?.position || "-"),
        escapeCsv(tx.atkItem?.name || "-"),
        escapeCsv(tx.quantity),
        escapeCsv(tx.atkItem?.unit || "pcs"),
        escapeCsv(tx.status),
        escapeCsv(cleanReason || "-"),
        escapeCsv(tx.adminNote || "-"),
      ].join(",")
    );
  });

  lines.push("");

  // ══════════════════════════════════════════════════════════════════
  // TABEL 2: REKAPITULASI PER DEPARTEMEN
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("2. REKAPITULASI PENGAJUAN PER DEPARTEMEN / DIVISI")].join(","));
  lines.push(
    [
      escapeCsv("No"),
      escapeCsv("Departemen / Divisi"),
      escapeCsv("Total Pengajuan"),
      escapeCsv("Diproses"),
      escapeCsv("Selesai"),
      escapeCsv("Ditolak"),
    ].join(",")
  );

  departmentSummary.forEach((dept, idx) => {
    lines.push(
      [
        escapeCsv(idx + 1),
        escapeCsv(dept.department),
        escapeCsv(dept.total),
        escapeCsv(dept.diproses ?? dept.inProgress ?? 0),
        escapeCsv(dept.selesai ?? dept.approved ?? 0),
        escapeCsv(dept.ditolak ?? dept.rejected ?? 0),
      ].join(",")
    );
  });

  lines.push("");

  // ══════════════════════════════════════════════════════════════════
  // TABEL 3: REKAPITULASI BARANG ATK
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("3. REKAPITULASI PENGGUNAAN BARANG ATK")].join(","));
  lines.push(
    [
      escapeCsv("No"),
      escapeCsv("Nama Barang ATK"),
      escapeCsv("Frekuensi Pengajuan"),
      escapeCsv("Total Kuantitas"),
      escapeCsv("Satuan"),
    ].join(",")
  );

  itemSummary.forEach((item, idx) => {
    lines.push(
      [
        escapeCsv(idx + 1),
        escapeCsv(item.name),
        escapeCsv(`${item.total} kali`),
        escapeCsv(item.quantity),
        escapeCsv(item.unit || "pcs"),
      ].join(",")
    );
  });

  lines.push("");
  lines.push([escapeCsv("Dokumen ini digenerate secara otomatis oleh Sistem Informasi Pengajuan ATK PT HasamitraJabar.")].join(","));

  // UTF-8 BOM (\uFEFF) ensures Excel and spreadsheet software correctly display UTF-8 without corrupted characters
  const csvContent = "\uFEFF" + lines.join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const fileName = `Laporan_ATK_HasamitraJabar_${dateStamp}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Dynamically loads xlsx library on demand and exports multi-sheet Excel (.xlsx) file
 */
export async function exportReportToExcel(params: {
  transactions: ReportTransactionExport[];
  departmentSummary: DepartmentSummaryExport[];
  itemSummary: ItemSummaryExport[];
  filterInfo: {
    startDate?: string;
    endDate?: string;
    department?: string;
    type?: string;
  };
}) {
  const XLSX = await import("xlsx");

  const { transactions, departmentSummary, itemSummary } = params;

  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const fileName = `Laporan_ATK_HasamitraJabar_${dateStamp}.xlsx`;

  // Sheet 1: Rincian Transaksi
  const txData = transactions.map((tx, idx) => {
    const isPurchase = tx.type === "purchase" || isPurchaseRequest(tx.reason);
    const cleanReason = cleanPurchaseReason(tx.reason);

    const formatDateVal = (dateStr?: string) => {
      if (!dateStr) return "-";
      try {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${mins}`;
      } catch {
        return dateStr;
      }
    };

    return {
      No: idx + 1,
      "Tanggal Pengajuan": formatDateVal(tx.createdAt),
      "Jenis Pengajuan": isPurchase ? "Pengajuan Pembelian ATK" : "Permintaan ATK Gudang",
      "Nama Pemohon": tx.user?.name || "-",
      Departemen: tx.user?.department || "-",
      Jabatan: tx.user?.position || "-",
      "Nama Barang ATK": tx.atkItem?.name || "-",
      Jumlah: tx.quantity,
      Satuan: tx.atkItem?.unit || "pcs",
      Status: tx.status,
      "Alasan / Keterangan": cleanReason || "-",
      "Catatan Admin": tx.adminNote || "-",
    };
  });

  // Sheet 2: Rekapitulasi Departemen
  const deptData = departmentSummary.map((dept, idx) => ({
    No: idx + 1,
    "Departemen / Divisi": dept.department,
    "Total Pengajuan": dept.total,
    Diproses: dept.diproses ?? dept.inProgress ?? 0,
    Selesai: dept.selesai ?? dept.approved ?? 0,
    Ditolak: dept.ditolak ?? dept.rejected ?? 0,
  }));

  // Sheet 3: Rekapitulasi Barang ATK
  const itemData = itemSummary.map((item, idx) => ({
    No: idx + 1,
    "Nama Barang ATK": item.name,
    "Frekuensi Pengajuan": `${item.total} kali`,
    "Total Kuantitas": item.quantity,
    Satuan: item.unit || "pcs",
  }));

  const wb = XLSX.utils.book_new();

  const wsTx = XLSX.utils.json_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, wsTx, "Daftar Transaksi");

  const wsDept = XLSX.utils.json_to_sheet(deptData);
  XLSX.utils.book_append_sheet(wb, wsDept, "Rekap Departemen");

  const wsItem = XLSX.utils.json_to_sheet(itemData);
  XLSX.utils.book_append_sheet(wb, wsItem, "Rekap Barang ATK");

  XLSX.writeFile(wb, fileName);
}

