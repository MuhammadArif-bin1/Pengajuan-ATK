"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/components/ui/Toast";
import { playNotificationSound } from "@/lib/notificationSound";

interface PurchaseItemRow {
  id: string;
  itemName: string;
  quantity: string;
}

export default function PengajuanPembelianPage() {
  const router = useRouter();
  const toast = useToast();

  // Layout & Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State: Data Pemohon
  const [applicantName, setApplicantName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");

  // Form State: Detail Barang Pembelian (supports multi-item via + button)
  const [items, setItems] = useState<PurchaseItemRow[]>([
    { id: "item-1", itemName: "", quantity: "1" },
  ]);

  // Form State: Catatan (Opsional)
  const [notes, setNotes] = useState("");

  // Validation errors & loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Notification State
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    itemName: string;
    status: string;
    userName: string;
    updatedAt: string;
  }>>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications in background (khusus pembelian)
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/portal-notifications?type=purchase&limit=20&_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifications(json.data);
          const pendingPurchaseCount = json.data.filter(
            (n: { isPurchase: boolean; status: string }) => n.isPurchase && n.status === "DIPROSES"
          ).length;
          setUnreadCount(pendingPurchaseCount);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // Click outside to close notif dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add Item Row (Figma (+) Button)
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, itemName: "", quantity: "1" },
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update Item Row
  const handleItemChange = (id: string, field: "itemName" | "quantity", value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    // clear error for this field
    if (errors[`${field}_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`${field}_${id}`];
        return next;
      });
    }
  };

  // Reset Form
  const handleReset = () => {
    if (
      applicantName ||
      department ||
      position ||
      items.some((i) => i.itemName) ||
      notes
    ) {
      if (!window.confirm("Apakah Anda yakin ingin membatalkan pengisian formulir?")) {
        return;
      }
    }
    setApplicantName("");
    setDepartment("");
    setPosition("");
    setItems([{ id: "item-1", itemName: "", quantity: "1" }]);
    setNotes("");
    setErrors({});
    router.push("/");
  };

  // Submit Purchase Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!applicantName.trim()) newErrors.applicantName = "Nama pemohon wajib diisi";
    if (!department.trim()) newErrors.department = "Departemen wajib diisi";

    const validItems: Array<{ itemName: string; quantity: number }> = [];

    items.forEach((item, idx) => {
      const cleanName = item.itemName.trim();
      const qty = parseInt(String(item.quantity).replace(/\D/g, ""), 10) || 0;

      if (!cleanName) {
        newErrors[`itemName_${item.id}`] = `Nama barang #${idx + 1} wajib diisi`;
      }
      if (qty < 1) {
        newErrors[`quantity_${item.id}`] = "Jumlah minimal 1";
      }
      if (cleanName && qty >= 1) {
        validItems.push({ itemName: cleanName, quantity: qty });
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Mohon lengkapi seluruh field yang bertanda bintang (*).");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/requests/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: applicantName.trim(),
          department: department.trim(),
          position: position.trim() || "Karyawan",
          items: validItems,
          reason: notes.trim() || "Permohonan pengadaan barang baru untuk operasional kantor",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal mengirim pengajuan pembelian ATK.");
        return;
      }

      if (soundEnabled) playNotificationSound();
      toast.success("Permohonan pembelian berhasil dikirim ke Manajemen Pembelian Admin!");

      // Reset form
      setApplicantName("");
      setDepartment("");
      setPosition("");
      setItems([{ id: "item-1", itemName: "", quantity: "1" }]);
      setNotes("");
      setErrors({});

      // Refresh notification badge
      fetchNotifs();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala jaringan saat mengirim formulir.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        role="PUBLIC"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab="purchase"
        purchaseBadgeCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 shadow-xs">
          {/* Left: Mobile Menu Trigger & Page Title */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Buka Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-[#323c4d] tracking-tight">
              Pengajuan Pembelian
            </h1>
          </div>

          {/* Right: Notifications Bell Icon */}
          <div className="flex items-center gap-3 relative" ref={notifDropdownRef}>
            <button
              type="button"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#ff8f00] hover:bg-orange-50 transition cursor-pointer relative shadow-2xs border border-orange-100"
              aria-label="Notifikasi Pengajuan"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#dc2626] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <span className="font-bold text-slate-800 text-sm">Notifikasi Pengajuan</span>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    {soundEnabled ? "🔔 Suara Aktif" : "🔕 Mute"}
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                  {notifications.slice(0, 8).map((notif) => (
                    <div key={notif.id} className="p-3 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{notif.itemName}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {notif.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Pemohon: {notif.userName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Form Card */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-5xl mx-auto bg-white rounded-[12px] border border-[#ebeef2] shadow-[0px_1px_3px_0px_rgba(96,108,128,0.05)] p-6 sm:p-10">
            {/* Form Header */}
            <div className="flex items-start gap-4 pb-6 border-b border-[#ebeef2]">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#606c80] flex items-center justify-center shrink-0">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#323c4d] tracking-tight">
                  Formulir Pengajuan Pembelian ATK
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#606c80] mt-1">
                  Ajukan permohonan pengadaan atau pembelian barang alat tulis kantor baru.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              {/* ══════════════════════════════════════════════════════
                  SECTION 1: DATA PEMOHON
              ══════════════════════════════════════════════════════ */}
              <div>
                <h3 className="text-xl font-black text-[#ff8f00] tracking-tight mb-4">
                  Data Pemohon
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nama */}
                  <div>
                    <label className="block text-sm font-black text-[#606c80] mb-2">
                      Nama <span className="text-[#fa0707]">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => {
                        setApplicantName(e.target.value);
                        if (errors.applicantName) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.applicantName;
                            return next;
                          });
                        }
                      }}
                      placeholder="Nama Lengkap Pemohon"
                      className={`w-full h-12 rounded-[5px] border px-3.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition ${
                        errors.applicantName ? "border-red-400 bg-red-50/20" : "border-slate-300"
                      }`}
                    />
                    {errors.applicantName && (
                      <p className="text-xs text-red-500 font-semibold mt-1">{errors.applicantName}</p>
                    )}
                  </div>

                  {/* Departemen */}
                  <div>
                    <label className="block text-sm font-black text-[#606c80] mb-2">
                      Departemen <span className="text-[#fa0707]">*</span>
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        if (errors.department) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.department;
                            return next;
                          });
                        }
                      }}
                      placeholder="Divisi / Departemen"
                      className={`w-full h-12 rounded-[5px] border px-3.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition ${
                        errors.department ? "border-red-400 bg-red-50/20" : "border-slate-300"
                      }`}
                    />
                    {errors.department && (
                      <p className="text-xs text-red-500 font-semibold mt-1">{errors.department}</p>
                    )}
                  </div>

                  {/* Jabatan */}
                  <div>
                    <label className="block text-sm font-black text-[#606c80] mb-2">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Jabatan Pemohon (Opsional)"
                      className="w-full h-12 rounded-[5px] border border-slate-300 px-3.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition"
                    />
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════
                  SECTION 2: DETAIL BARANG PEMBELIAN
              ══════════════════════════════════════════════════════ */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-[#ff8f00] tracking-tight">
                    Detail Barang Pembelian
                  </h3>
                  {items.length > 1 && (
                    <span className="text-xs font-semibold text-slate-400">
                      Total: {items.length} Barang
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {items.map((row, index) => {
                    const nameErr = errors[`itemName_${row.id}`];
                    const qtyErr = errors[`quantity_${row.id}`];

                    return (
                      <div key={row.id} className="relative group">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                          {/* Nama Barang ATK */}
                          <div className="sm:col-span-8">
                            <label className="block text-sm font-black text-[#606c80] mb-1.5">
                              Nama Barang ATK <span className="text-[#fa0707]">*</span>
                            </label>
                            <input
                              type="text"
                              value={row.itemName}
                              onChange={(e) => handleItemChange(row.id, "itemName", e.target.value)}
                              placeholder={`Contoh: Kertas HVS A4 80gr, Binder Clip No. 105...`}
                              className={`w-full h-12 rounded-[5px] border px-3.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition ${
                                nameErr ? "border-red-400 bg-red-50/20" : "border-slate-300"
                              }`}
                            />
                            {nameErr && (
                              <p className="text-xs text-red-500 font-semibold mt-1">{nameErr}</p>
                            )}
                          </div>

                          {/* Jumlah */}
                          <div className="sm:col-span-4 flex items-start gap-2">
                            <div className="flex-1">
                              <label className="block text-sm font-black text-[#606c80] mb-1.5">
                                Jumlah <span className="text-[#fa0707]">*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={row.quantity}
                                onChange={(e) => handleItemChange(row.id, "quantity", e.target.value)}
                                className={`w-full h-12 rounded-[5px] border px-3.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition ${
                                  qtyErr ? "border-red-400 bg-red-50/20" : "border-slate-300"
                                }`}
                              />
                              {qtyErr && (
                                <p className="text-xs text-red-500 font-semibold mt-1">{qtyErr}</p>
                              )}
                            </div>

                            {/* Tombol Hapus Baris jika lebih dari 1 */}
                            {items.length > 1 && (
                              <div className="pt-7">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(row.id)}
                                  className="h-12 w-10 rounded-[5px] border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                                  title="Hapus baris barang ini"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Orange Full-width (+) Button as in Figma Design */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full h-12 bg-[#ff8f00] hover:bg-[#e68100] text-white font-black text-2xl rounded-[5px] flex items-center justify-center transition-all cursor-pointer mt-3 shadow-xs active:scale-[0.99]"
                  title="Tambah Barang Lainnya"
                  aria-label="Tambah Barang Pembelian"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════
                  SECTION 3: CATATAN (OPSIONAL)
              ══════════════════════════════════════════════════════ */}
              <div>
                <h3 className="text-lg font-black text-[#606c80] tracking-tight mb-2">
                  Catatan (Opsional)
                </h3>
                <textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan khusus, spesifikasi merk barang, alasan urgensi, atau perkiraan kebutuhan..."
                  className="w-full h-44 rounded-[5px] border border-slate-300 p-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition resize-none"
                />
              </div>

              {/* ══════════════════════════════════════════════════════
                  BUTTON ACTIONS: BATAL & SIMPAN
              ══════════════════════════════════════════════════════ */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#ebeef2]">
                {/* Tombol Batal */}
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={submitting}
                  className="h-[51px] w-[171px] bg-[#ff8f00] hover:bg-[#e68100] text-white font-black text-lg rounded-[6px] transition cursor-pointer flex items-center justify-center shadow-xs active:scale-[0.98] disabled:opacity-50"
                >
                  Batal
                </button>

                {/* Tombol Simpan */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[51px] w-[171px] bg-[#01923f] hover:bg-[#017834] text-white font-black text-lg rounded-[6px] transition cursor-pointer flex items-center justify-center shadow-xs active:scale-[0.98] disabled:opacity-50 gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
