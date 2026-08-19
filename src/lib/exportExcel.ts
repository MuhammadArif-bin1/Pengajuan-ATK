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
  approved: number;
  inProgress: number;
  rejected: number;
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
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r") || str.includes(";")) {
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
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
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
      : "Semua Pengajuan";

  const departmentText = filterInfo.department || "Semua Departemen";
  const printedAt = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: string[] = [];

  // ══════════════════════════════════════════════════════════════════
  // HEADER DOKUMEN
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("LAPORAN TRANSAKSI PENGAJUAN ALAT TULIS KANTOR")].join(","));
  lines.push([escapeCsv("HASAMITRA - SISTEM INFORMASI ATK")].join(","));
  lines.push("");
  lines.push([escapeCsv("Periode Laporan"), escapeCsv(periodText)].join(","));
  lines.push([escapeCsv("Kategori Filter"), escapeCsv(categoryText)].join(","));
  lines.push([escapeCsv("Departemen"), escapeCsv(departmentText)].join(","));
  lines.push([escapeCsv("Waktu Cetak / Unduh"), escapeCsv(printedAt)].join(","));
  lines.push([escapeCsv("Total Transaksi"), escapeCsv(`${transactions.length} Data`)].join(","));
  lines.push("");

  // ══════════════════════════════════════════════════════════════════
  // SECTION 1: RINCIAN TRANSAKSI PENGAJUAN
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("=== 1. RINCIAN TRANSAKSI PENGAJUAN ATK ===")].join(","));
  lines.push(
    [
      escapeCsv("NO"),
      escapeCsv("TANGGAL PENGAJUAN"),
      escapeCsv("JENIS PENGAJUAN"),
      escapeCsv("NAMA KARYAWAN"),
      escapeCsv("DEPARTEMEN"),
      escapeCsv("JABATAN"),
      escapeCsv("NAMA BARANG ATK"),
      escapeCsv("JUMLAH"),
      escapeCsv("SATUAN"),
      escapeCsv("STATUS PENGAJUAN"),
      escapeCsv("ALASAN / KEPERLUAN"),
      escapeCsv("CATATAN ADMIN"),
    ].join(",")
  );

  transactions.forEach((tx, idx) => {
    const isPurchase =
      tx.type === "purchase" ||
      (tx.reason && tx.reason.includes("[PENGAJUAN PEMBELIAN ATK BARU]"));

    let cleanReason = (tx.reason || "")
      .replace("[PENGAJUAN PEMBELIAN ATK BARU]", "")
      .replace("[PERMINTAAN ATK]", "")
      .trim();

    if (cleanReason.startsWith("Alasan:")) {
      cleanReason = cleanReason.replace(/^Alasan:\s*/, "").trim();
    }

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
  lines.push("");

  // ══════════════════════════════════════════════════════════════════
  // SECTION 2: REKAPITULASI PER DEPARTEMEN
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("=== 2. REKAPITULASI PER DEPARTEMEN / DIVISI ===")].join(","));
  lines.push(
    [
      escapeCsv("NO"),
      escapeCsv("NAMA DEPARTEMEN"),
      escapeCsv("TOTAL PENGAJUAN"),
      escapeCsv("DISETUJUI / SELESAI"),
      escapeCsv("MENUNGGU / DIPROSES"),
      escapeCsv("DITOLAK"),
    ].join(",")
  );

  departmentSummary.forEach((dept, idx) => {
    lines.push(
      [
        escapeCsv(idx + 1),
        escapeCsv(dept.department),
        escapeCsv(dept.total),
        escapeCsv(dept.approved),
        escapeCsv(dept.inProgress),
        escapeCsv(dept.rejected),
      ].join(",")
    );
  });

  lines.push("");
  lines.push("");

  // ══════════════════════════════════════════════════════════════════
  // SECTION 3: TOP BARANG ATK
  // ══════════════════════════════════════════════════════════════════
  lines.push([escapeCsv("=== 3. REKAPITULASI PENGGUNAAN BARANG ATK ===")].join(","));
  lines.push(
    [
      escapeCsv("NO"),
      escapeCsv("NAMA BARANG ATK"),
      escapeCsv("FREKUENSI PENGAJUAN"),
      escapeCsv("TOTAL KUANTITAS"),
      escapeCsv("SATUAN"),
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

  // UTF-8 BOM (\uFEFF) ensures Excel correctly displays Indonesian characters and formatting without corrupted symbols
  const csvContent = "\uFEFF" + lines.join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const fileName = `Laporan_ATK_Hasamitra_${dateStamp}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
