"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import type { AtkItemData } from "@/types/atk";

const ATK_PURCHASE_CATEGORIES: Record<string, string[]> = {
  "Alat Tulis & Menggambar": [
    "Pulpen Gel Hitam Standar (1 Box / Lusin)",
    "Pulpen Gel Biru Standar (1 Box / Lusin)",
    "Pulpen Gel Merah (1 Box)",
    "Spidol Whiteboard Boardmarker Hitam/Biru (Snowman)",
    "Spidol Permanent Marker Hitam/Biru",
    "Pensil 2B (Faber-Castell / Joyko)",
    "Penghapus Karet Pensil Putih",
    "Correction Tape / Tipp-Ex Kertas Roll",
    "Highlighter / Stabilo Warna Warni",
    "Penggaris Besi / Plastik 30cm",
  ],
  "Kertas & Buku Catatan": [
    "Kertas HVS A4 70 gsm (1 Rim)",
    "Kertas HVS A4 80 gsm (1 Rim)",
    "Kertas HVS F4 / Folio 70 gsm (1 Rim)",
    "Kertas HVS F4 / Folio 80 gsm (1 Rim)",
    "Kertas Foto Glossy A4",
    "Kertas NCR 2 Ply / 3 Ply Rangkap",
    "Buku Tulis Ekspedisi / Folio Bergaris",
    "Buku Catatan Agenda Rapat Hardcover A5",
    "Sticky Notes Yellow 3x3 (Post-it)",
    "Post-it Index Penanda Pembatas Halaman",
  ],
  "Media Cetak & Tinta Printer": [
    "Tinta Printer Canon GI-790 Black (Hitam)",
    "Tinta Printer Canon GI-790 Cyan / Magenta / Yellow (Warna)",
    "Tinta Printer Epson 003 Black (Hitam)",
    "Tinta Printer Epson 003 Color (C/M/Y)",
    "Tinta Printer Brother BT-D60BK",
    "Toner Laser HP / Canon 85A Standar",
    "Pita Ribbon Kasir / Dot Matrix",
    "Kertas Thermal Roll Kasir 58mm / 80mm",
  ],
  "Filing & Dokumen (Map/Ordner)": [
    "Map Plastik L Folder A4 / F4 Transparan (1 Lusin)",
    "Map Plastik Snelhechter / Lubang Berpenjepit",
    "Map Kancing Zipper Dokumen",
    "Ordner / Binder Dokumen Tebal (Bantex)",
    "Stopmap Kertas Folio Standar (1 Pack)",
    "Clear Holder Dokumen 20 / 40 Lembar",
    "Amplop Putih Standar Perekat (1 Kotak)",
    "Amplop Coklat Tali / Non-Tali F4 (1 Kotak)",
    "Pembatas Dokumen / Divider Binder",
  ],
  "Peralatan & Perlengkapan Kantor": [
    "Stapler Sedang HD-10 (Joyko / Max)",
    "Stapler Besar HD-50 Heavy Duty",
    "Isi Staples No.10 Max / Joyko (1 Kotak)",
    "Isi Staples No.3 / 24/6 (1 Kotak)",
    "Gunting Stainless Kantor Sedang / Besar",
    "Cutter Besar L-500 & Isi Ulang Pisau",
    "Lakban Bening / Coklat 2 Inch",
    "Double Tape Busa / Kertas 1 Inch",
    "Paper Clip / Klip Kertas Trigonal No.3",
    "Binder Clip Sedang (No. 155 / 200)",
    "Binder Clip Besar (No. 260)",
    "Lem Kertas Stik / Cair Joyko",
    "Kalkulator Meja 12 Digit Citizen / Casio",
    "Papan Tulis Whiteboard 90x60cm / 120x80cm",
    "Stempel Tanggal & Tinta Bak Stempel",
  ],
  "Perangkat IT & Elektronik Kantor": [
    "Mouse USB Optik Standar (Logitech)",
    "Mouse Wireless USB",
    "Keyboard Standar USB",
    "Flashdisk 32 GB SanDisk Original",
    "Flashdisk 64 GB SanDisk Original",
    "Baterai Alkaline AA (1 Pack)",
    "Baterai Alkaline AAA (1 Pack)",
    "Kabel Colokan Stop Kontak Sambung 5 Lubang",
  ],
  "Lainnya": [
    "Pengadaan ATK Baru Lainnya (Tuliskan di Catatan)",
  ],
};

export default function PublicUserPortalPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"request" | "purchase" | "catalog">("request");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form 1: Permintaan ATK dari Gudang
  const [requestForm, setRequestForm] = useState({
    userName: "",
    department: "",
    position: "",
    atkItemId: "",
    quantity: 1,
    reason: "",
  });
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submittedRequestSuccess, setSubmittedRequestSuccess] = useState<any | null>(null);

  // Form 2: Pengajuan Pembelian ATK Baru
  const [purchaseForm, setPurchaseForm] = useState({
    userName: "",
    department: "",
    position: "",
    category: "Alat Tulis & Menggambar",
    itemName: "",
    quantity: 1,
    reason: "",
  });
  const [purchaseErrors, setPurchaseErrors] = useState<Record<string, string>>({});
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [submittedPurchaseSuccess, setSubmittedPurchaseSuccess] = useState<any | null>(null);

  // Items State (Gudang)
  const [items, setItems] = useState<AtkItemData[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const res = await fetch("/api/atk");
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch (err) {
      console.error("Fetch items error:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const selectedItemObj = useMemo(
    () => items.find((i) => i.id === requestForm.atkItemId),
    [items, requestForm.atkItemId]
  );

  // Validation Form 1
  const validateRequestForm = () => {
    const errors: Record<string, string> = {};
    if (!requestForm.userName.trim()) errors.userName = "Nama lengkap pemohon wajib diisi";
    if (!requestForm.department.trim()) errors.department = "Departemen/Divisi wajib diisi";
    if (!requestForm.position.trim()) errors.position = "Jabatan pemohon wajib diisi";
    if (!requestForm.atkItemId) errors.atkItemId = "Silakan pilih barang ATK dari gudang";
    if (!requestForm.quantity || requestForm.quantity < 1) errors.quantity = "Jumlah minimal 1";
    if (selectedItemObj && requestForm.quantity > selectedItemObj.stock) {
      errors.quantity = `Kuantitas melebihi stok tersedia (${selectedItemObj.stock} ${selectedItemObj.unit})`;
    }

    setRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRequestForm()) return;

    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengirim pengajuan");
      }

      toast.success("Pengajuan permintaan ATK berhasil dikirim ke Admin!");
      setSubmittedRequestSuccess(result.data);

      setRequestForm((prev) => ({
        ...prev,
        atkItemId: "",
        quantity: 1,
        reason: "",
      }));
      setRequestErrors({});
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kendala saat mengirim pengajuan");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Validation Form 2
  const validatePurchaseForm = () => {
    const errors: Record<string, string> = {};
    if (!purchaseForm.userName.trim()) errors.userName = "Nama lengkap pemohon wajib diisi";
    if (!purchaseForm.department.trim()) errors.department = "Departemen/Divisi wajib diisi";
    if (!purchaseForm.position.trim()) errors.position = "Jabatan pemohon wajib diisi";
    if (!purchaseForm.itemName.trim()) errors.itemName = "Nama barang ATK yang ingin dibeli wajib diisi";
    if (!purchaseForm.quantity || purchaseForm.quantity < 1) errors.quantity = "Jumlah pembelian minimal 1";

    setPurchaseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePurchaseForm()) return;

    setSubmittingPurchase(true);
    try {
      const res = await fetch("/api/requests/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseForm),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengirim permohonan pembelian");
      }

      toast.success("Pengajuan pembelian ATK berhasil dikirim!");
      setSubmittedPurchaseSuccess(result.data);

      setPurchaseForm((prev) => ({
        ...prev,
        itemName: "",
        quantity: 1,
        reason: "",
      }));
      setPurchaseErrors({});
    } catch (err: any) {
      toast.error(err.message || "Terjadi kendala saat mengirim permohonan");
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const handleSelectFromCatalog = (itemId: string) => {
    setRequestForm((prev) => ({ ...prev, atkItemId: itemId }));
    setActiveTab("request");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCatalog = useMemo(() => {
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(catalogSearch.toLowerCase()))
      );
    });
  }, [items, catalogSearch]);

  const navTabs = [
    {
      key: "request" as const,
      label: "Form Pengajuan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      key: "purchase" as const,
      label: "Pengajuan Pembelian ATK",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      key: "catalog" as const,
      label: "Katalog ATK",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  const getBreadcrumb = () => {
    switch (activeTab) {
      case "request":
        return "Form Pengajuan";
      case "purchase":
        return "Pengajuan Pembelian ATK";
      case "catalog":
        return "Katalog ATK";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80 flex font-sans">
      {/* ─── MOBILE BACKDROP ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR (Vibrant Orange #FF5500 - Identical to Admin) ─── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#FF5500] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Image/logo/logo-bulat.png"
                alt="Hasamitra Logo"
                className="w-10 h-10 rounded-full object-cover bg-white shadow-sm"
              />
              <div>
                <h1 className="font-bold text-white text-base leading-tight tracking-wide">
                  Hasamitra
                </h1>
                <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider mt-0.5">
                  PORTAL KARYAWAN
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <p className="px-3 text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3">
              MENU UTAMA
            </p>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-white text-[#FF5500] shadow-md font-bold"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-[#FF5500]" : "text-white"}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Link: Portal Admin */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/admin/login"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-white bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Portal Admin</span>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* ─── TOP NAVBAR HEADER (Identical to Admin) ─── */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Portal Karyawan</span>
              <span>/</span>
              <span className="font-bold text-gray-900">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Online</span>
            </div>

            <Link
              href="/admin/login"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors shadow-2xs"
            >
              <span>Portal Admin</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </header>

        {/* ─── PAGE CONTENT ─── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ═══ TAB 1: FORM PENGAJUAN PERMINTAAN ATK GUDANG ═════════ */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "request" && (
            <div className="space-y-6">
              {/* Success Alert */}
              {submittedRequestSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Pengajuan Berhasil Terkirim!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Pengajuan Anda untuk <b>{submittedRequestSuccess.atkItem?.name}</b> ({submittedRequestSuccess.quantity} {submittedRequestSuccess.atkItem?.unit}) telah tersimpan dan sedang menunggu persetujuan Admin.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmittedRequestSuccess(null)}
                    className="text-xs font-bold text-emerald-700 hover:underline shrink-0 cursor-pointer"
                  >
                    ✕ Tutup
                  </button>
                </div>
              )}

              {/* Form Card */}
              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Formulir Pengajuan ATK</h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">Lengkapi data pemohon dan detail alat tulis kantor yang Anda butuhkan dari stok gudang.</p>
                </div>

                <form onSubmit={handleRequestSubmit} className="p-6 sm:p-8 space-y-6">
                  {/* Section 1: Data Pemohon */}
                  <div>
                    <span className="text-[11px] font-extrabold text-[#FF5500] uppercase tracking-widest block mb-3">
                      1. DATA PEMOHON (KARYAWAN)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Budi Santoso"
                          value={requestForm.userName}
                          onChange={(e) => setRequestForm({ ...requestForm, userName: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            requestErrors.userName ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {requestErrors.userName && <p className="text-[11px] text-red-500 mt-1">{requestErrors.userName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Departemen / Divisi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Keuangan, HRD, IT"
                          value={requestForm.department}
                          onChange={(e) => setRequestForm({ ...requestForm, department: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            requestErrors.department ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {requestErrors.department && <p className="text-[11px] text-red-500 mt-1">{requestErrors.department}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Jabatan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Staff Keuangan, Supervisor"
                          value={requestForm.position}
                          onChange={(e) => setRequestForm({ ...requestForm, position: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            requestErrors.position ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {requestErrors.position && <p className="text-[11px] text-red-500 mt-1">{requestErrors.position}</p>}
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Section 2: Detail Barang */}
                  <div>
                    <span className="text-[11px] font-extrabold text-[#FF5500] uppercase tracking-widest block mb-3">
                      2. DETAIL BARANG YANG DIAJUKAN
                    </span>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Pilih Barang ATK <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={requestForm.atkItemId}
                            onChange={(e) => setRequestForm({ ...requestForm, atkItemId: e.target.value })}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                              requestErrors.atkItemId ? "border-red-400 bg-red-50/20" : "border-gray-300"
                            }`}
                          >
                            <option value="">-- Pilih Barang dari Gudang --</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} — (Stok Tersedia: {item.stock} {item.unit})
                              </option>
                            ))}
                          </select>
                          {requestErrors.atkItemId && <p className="text-[11px] text-red-500 mt-1">{requestErrors.atkItemId}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Jumlah yang Dibutuhkan <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selectedItemObj ? selectedItemObj.stock : undefined}
                            value={requestForm.quantity}
                            onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value, 10) || 1 })}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                              requestErrors.quantity ? "border-red-400 bg-red-50/20" : "border-gray-300"
                            }`}
                          />
                          {requestErrors.quantity && <p className="text-[11px] text-red-500 mt-1">{requestErrors.quantity}</p>}
                        </div>
                      </div>

                      {selectedItemObj && (
                        <div className="flex items-center justify-between p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-gray-900">{selectedItemObj.name}</p>
                            {selectedItemObj.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5">{selectedItemObj.description}</p>
                            )}
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-[#FF5500] text-white font-bold text-[11px] shrink-0">
                            Stok: {selectedItemObj.stock} {selectedItemObj.unit}
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Alasan & Keperluan Penggunaan <span className="text-gray-400 font-normal">(Opsional)</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Jelaskan keperluan penggunaan ATK jika diperlukan (opsional)..."
                          value={requestForm.reason}
                          onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                          className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] text-white text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingRequest ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Mengirim Pengajuan...</span>
                        </>
                      ) : (
                        <span>Kirim Pengajuan ATK</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ═══ TAB 2: FORM PENGAJUAN PEMBELIAN ATK BARU ════════════ */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "purchase" && (
            <div className="space-y-6">
              {/* Success Alert */}
              {submittedPurchaseSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Pengajuan Pembelian Berhasil Terkirim!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Permohonan pembelian <b>{submittedPurchaseSuccess.atkItem?.name}</b> sejumlah <b>{submittedPurchaseSuccess.quantity} item</b> telah tersimpan dan menunggu persetujuan Admin.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmittedPurchaseSuccess(null)}
                    className="text-xs font-bold text-emerald-700 hover:underline shrink-0 cursor-pointer"
                  >
                    ✕ Tutup
                  </button>
                </div>
              )}

              {/* Form Card */}
              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Formulir Pengajuan Pembelian ATK</h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">Ajukan permohonan pengadaan atau pembelian barang alat tulis kantor baru.</p>
                </div>

                <form onSubmit={handlePurchaseSubmit} className="p-6 sm:p-8 space-y-6">
                  {/* Section 1: Data Pemohon */}
                  <div>
                    <span className="text-[11px] font-extrabold text-[#FF5500] uppercase tracking-widest block mb-3">
                      1. DATA PEMOHON (KARYAWAN)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Budi Santoso"
                          value={purchaseForm.userName}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, userName: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            purchaseErrors.userName ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {purchaseErrors.userName && <p className="text-[11px] text-red-500 mt-1">{purchaseErrors.userName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Departemen / Divisi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Marketing, HRD, IT"
                          value={purchaseForm.department}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, department: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            purchaseErrors.department ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {purchaseErrors.department && <p className="text-[11px] text-red-500 mt-1">{purchaseErrors.department}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Jabatan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Staff Marketing, Officer"
                          value={purchaseForm.position}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, position: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            purchaseErrors.position ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {purchaseErrors.position && <p className="text-[11px] text-red-500 mt-1">{purchaseErrors.position}</p>}
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Section 2: Detail Pembelian */}
                  <div>
                    <span className="text-[11px] font-extrabold text-[#FF5500] uppercase tracking-widest block mb-3">
                      2. DETAIL BARANG PEMBELIAN YANG DIAJUKAN
                    </span>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Dropdown 1: Kategori Barang */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Pilih Kategori Barang <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={purchaseForm.category}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              setPurchaseForm({
                                ...purchaseForm,
                                category: newCat,
                                itemName: "",
                              });
                            }}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition cursor-pointer"
                          >
                            {Object.keys(ATK_PURCHASE_CATEGORIES).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Dropdown 2: Nama Barang ATK (Pilihan Berdasarkan Kategori) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Pilih Nama Barang ATK <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={purchaseForm.itemName}
                            onChange={(e) =>
                              setPurchaseForm({ ...purchaseForm, itemName: e.target.value })
                            }
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition cursor-pointer ${
                              purchaseErrors.itemName
                                ? "border-red-400 bg-red-50/20"
                                : "border-gray-300"
                            }`}
                          >
                            <option value="">-- Silakan Pilih Barang ATK --</option>
                            {(
                              ATK_PURCHASE_CATEGORIES[purchaseForm.category] ||
                              ATK_PURCHASE_CATEGORIES["Alat Tulis & Menggambar"]
                            ).map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          {purchaseErrors.itemName && (
                            <p className="text-[11px] text-red-500 mt-1">
                              {purchaseErrors.itemName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Jumlah Kuantitas */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Jumlah yang Dibutuhkan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={purchaseForm.quantity}
                          onChange={(e) =>
                            setPurchaseForm({
                              ...purchaseForm,
                              quantity: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className={`w-full sm:w-48 rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            purchaseErrors.quantity
                              ? "border-red-400 bg-red-50/20"
                              : "border-gray-300"
                          }`}
                        />
                        {purchaseErrors.quantity && (
                          <p className="text-[11px] text-red-500 mt-1">
                            {purchaseErrors.quantity}
                          </p>
                        )}
                      </div>

                      {/* Alasan & Catatan */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Alasan & Catatan Pembelian <span className="text-gray-400 font-normal">(Opsional)</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Jelaskan alasan atau urgensi pembelian barang jika diperlukan (opsional)..."
                          value={purchaseForm.reason}
                          onChange={(e) =>
                            setPurchaseForm({ ...purchaseForm, reason: e.target.value })
                          }
                          className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingPurchase}
                      className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] text-white text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingPurchase ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Memproses Permohonan...</span>
                        </>
                      ) : (
                        <span>Kirim Pengajuan Pembelian ATK</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ═══ TAB 3: KATALOG BARANG ATK PERSEDIAAN GUDANG ═════════ */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Katalog Persediaan ATK
                  </h1>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Daftar alat tulis kantor yang siap diajukan untuk operasional kerja.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("purchase")}
                  className="px-4 py-2 bg-[#FF5500] hover:bg-[#e04b00] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                >
                  + Ajukan Pembelian Barang Baru
                </button>
              </div>

              {/* Search Filters */}
              <div className="bg-white border border-gray-200/70 rounded-2xl p-4 shadow-2xs">
                <input
                  type="text"
                  placeholder="Cari nama barang ATK..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition"
                />
              </div>

              {/* Catalog Grid */}
              {loadingItems ? (
                <div className="py-16 text-center text-gray-400 text-xs font-medium">
                  Memuat katalog barang...
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs font-medium">
                  Belum ada data barang ATK di gudang.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCatalog.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-2xs hover:border-[#FF5500]/50 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                              item.stock > 10
                                ? "bg-emerald-100 text-emerald-800"
                                : item.stock > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.stock > 0 ? `Stok: ${item.stock} ${item.unit}` : "Habis"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {item.description || "Alat tulis kantor standar perusahaan."}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          disabled={item.stock === 0}
                          onClick={() => handleSelectFromCatalog(item.id)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            item.stock > 0
                              ? "bg-[#FF5500] hover:bg-[#e04b00] text-white shadow-2xs"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {item.stock > 0 ? "Ajukan Barang Ini" : "Stok Habis"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
