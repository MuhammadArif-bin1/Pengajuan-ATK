"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { AtkCatalogItem } from "./types";
import { useToast } from "@/components/ui/Toast";
import { playNotificationSound } from "@/lib/notificationSound";

export interface PengajuanAtkItemRow {
  id: string;
  atkItemId: string;
  itemName: string;
  unit: string;
  maxStock: number;
  quantity: string;
}

export interface PengajuanAtkModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogItems?: AtkCatalogItem[];
  onSuccess?: () => void;
  soundEnabled?: boolean;
}

export const PengajuanAtkModal: React.FC<PengajuanAtkModalProps> = ({
  isOpen,
  onClose,
  catalogItems = [],
  onSuccess,
  soundEnabled = true,
}) => {
  const toast = useToast();

  // Form State: Data Pemohon
  const [applicantName, setApplicantName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");

  // Form State: Detail Barang ATK (selected from existing warehouse catalog only)
  const [items, setItems] = useState<PengajuanAtkItemRow[]>([
    { id: "atk-row-1", atkItemId: "", itemName: "", unit: "pcs", maxStock: 0, quantity: "1" },
  ]);

  // Form State: Catatan (Opsional)
  const [notes, setNotes] = useState("");

  // Validation errors & loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  // Add Item Row (Figma (+) Button)
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `atk-row-${Date.now()}`,
        atkItemId: "",
        itemName: "",
        unit: "pcs",
        maxStock: 0,
        quantity: "1",
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle Item Select from Catalog
  const handleItemSelect = (rowId: string, selectedCatalogId: string) => {
    const matched = catalogItems.find((c) => c.id === selectedCatalogId);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        return {
          ...item,
          atkItemId: selectedCatalogId,
          itemName: matched ? matched.name : "",
          unit: matched?.unit || "pcs",
          maxStock: matched ? matched.stock : 0,
        };
      })
    );

    // Clear errors for this item
    if (errors[`item_${rowId}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${rowId}`];
        return next;
      });
    }
  };

  // Handle Quantity Change
  const handleQuantityChange = (rowId: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, quantity: value } : item))
    );

    if (errors[`quantity_${rowId}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`quantity_${rowId}`];
        return next;
      });
    }
  };

  // Reset & Close
  const handleResetAndClose = () => {
    if (
      applicantName ||
      department ||
      position ||
      items.some((i) => i.atkItemId) ||
      notes
    ) {
      if (!window.confirm("Apakah Anda yakin ingin membatalkan pengisian formulir pengajuan ATK?")) {
        return;
      }
    }
    setApplicantName("");
    setDepartment("");
    setPosition("");
    setItems([{ id: "atk-row-1", atkItemId: "", itemName: "", unit: "pcs", maxStock: 0, quantity: "1" }]);
    setNotes("");
    setErrors({});
    onClose();
  };

  // Submit ATK Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!applicantName.trim()) newErrors.applicantName = "Nama pemohon wajib diisi";
    if (!department.trim()) newErrors.department = "Departemen wajib diisi";

    const validItems: Array<{
      atkItemId: string;
      itemName: string;
      quantity: number;
    }> = [];

    items.forEach((item, idx) => {
      if (!item.atkItemId) {
        newErrors[`item_${item.id}`] = `Pilih barang ATK #${idx + 1} dari stok gudang`;
      }

      const qty = parseInt(String(item.quantity).replace(/\D/g, ""), 10) || 0;
      if (qty < 1) {
        newErrors[`quantity_${item.id}`] = "Jumlah minimal 1";
      } else if (item.maxStock > 0 && qty > item.maxStock) {
        newErrors[`quantity_${item.id}`] = `Maks. stok tersedia: ${item.maxStock}`;
      }

      if (item.atkItemId && qty >= 1) {
        validItems.push({
          atkItemId: item.atkItemId,
          itemName: item.itemName,
          quantity: qty,
        });
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Mohon periksa kembali isian formulir yang ditandai merah.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: applicantName.trim(),
          department: department.trim(),
          position: position.trim() || "Karyawan",
          items: validItems,
          reason: notes.trim() || "Permintaan alat tulis kantor untuk operasional kerja",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal mengirim formulir pengajuan ATK.");
        return;
      }

      if (soundEnabled) playNotificationSound();
      toast.success("🎉 Pengajuan ATK berhasil dikirim dan masuk ke antrian logistik!");

      // Reset form
      setApplicantName("");
      setDepartment("");
      setPosition("");
      setItems([{ id: "atk-row-1", atkItemId: "", itemName: "", unit: "pcs", maxStock: 0, quantity: "1" }]);
      setNotes("");
      setErrors({});

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala jaringan saat mengirim formulir pengajuan ATK.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          handleResetAndClose();
        }
      }}
    >
      {/* Floating Form Card with Matching Figma Design */}
      <div className="relative w-full max-w-4xl bg-white rounded-[14px] border border-[#ebeef2] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] p-6 sm:p-10 my-8 max-h-[92vh] overflow-y-auto transition-all animate-in zoom-in-95 duration-200">
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={handleResetAndClose}
          disabled={submitting}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
          aria-label="Tutup Formulir"
          title="Tutup (Esc)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Form Header */}
        <div className="flex items-start gap-4 pb-6 border-b border-[#ebeef2]">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#ff8f00] flex items-center justify-center shrink-0 border border-orange-100 shadow-2xs">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="pr-8">
            <h2 className="text-xl sm:text-2xl font-black text-[#323c4d] tracking-tight">
              Formulir Pengajuan ATK
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#606c80] mt-1">
              Ajukan permohonan pengambilan alat tulis kantor yang tersedia pada stok gudang logistik. Permohonan Anda akan langsung masuk ke antrian verifikasi.
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
              SECTION 2: DETAIL BARANG ATK (PILIH DARI STOK)
          ══════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-[#ff8f00] tracking-tight">
                Detail Barang ATK (Pilih dari Stok Gudang)
              </h3>
              {items.length > 1 && (
                <span className="text-xs font-semibold text-slate-400">
                  Total: {items.length} Barang
                </span>
              )}
            </div>

            <div className="space-y-3">
              {items.map((row, index) => {
                const itemErr = errors[`item_${row.id}`];
                const qtyErr = errors[`quantity_${row.id}`];

                return (
                  <div key={row.id} className="relative group p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      {/* Pilih Barang dari Stok */}
                      <div className="sm:col-span-8">
                        <label className="block text-sm font-black text-[#606c80] mb-1.5">
                          Nama Barang ATK <span className="text-[#fa0707]">*</span>
                        </label>
                        <select
                          value={row.atkItemId}
                          onChange={(e) => handleItemSelect(row.id, e.target.value)}
                          className={`w-full h-12 rounded-[5px] border px-3 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition ${
                            itemErr ? "border-red-400 bg-red-50/20" : "border-slate-300"
                          }`}
                        >
                          <option value="">-- Pilih Barang dari Stok Gudang --</option>
                          {catalogItems.map((cat) => (
                            <option
                              key={cat.id}
                              value={cat.id}
                              disabled={cat.stock <= 0}
                            >
                              {cat.name} (Tersedia: {cat.stock} {cat.unit || "pcs"}{cat.stock <= 0 ? " - Habis" : ""})
                            </option>
                          ))}
                        </select>
                        {itemErr && (
                          <p className="text-xs text-red-500 font-semibold mt-1">{itemErr}</p>
                        )}
                        {row.atkItemId && row.maxStock > 0 && (
                          <p className="text-[11px] font-semibold text-emerald-600 mt-1">
                            ✓ Stok tersedia: {row.maxStock} {row.unit}
                          </p>
                        )}
                      </div>

                      {/* Jumlah */}
                      <div className="sm:col-span-4 flex items-start gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-black text-[#606c80] mb-1.5">
                            Jumlah ({row.unit || "pcs"}) <span className="text-[#fa0707]">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={row.maxStock > 0 ? row.maxStock : undefined}
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(row.id, e.target.value)}
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

            {/* Info Tip Pengadaan Barang Baru */}
            <div className="mt-3 p-3 rounded-lg bg-orange-50/70 border border-orange-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 text-base">💡</span>
                <span>Barang yang Anda butuhkan belum ada di stok gudang atau habis?</span>
              </div>
              <Link
                href="/user/pengajuan-pembelian"
                onClick={onClose}
                className="font-bold text-[#ff8f00] hover:text-[#e68100] underline shrink-0 ml-2"
              >
                Ajukan Pengadaan Baru &rarr;
              </Link>
            </div>

            {/* Orange Full-width (+) Button as in Figma Design */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full h-12 bg-[#ff8f00] hover:bg-[#e68100] text-white font-black text-2xl rounded-[5px] flex items-center justify-center transition-all cursor-pointer mt-3 shadow-xs active:scale-[0.99]"
              title="Tambah Barang Lainnya"
              aria-label="Tambah Barang ATK"
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
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan keperluan pemakaian ATK, divisi pengguna, atau catatan kebutuhan operasional lainnya..."
              className="w-full h-32 rounded-[5px] border border-slate-300 p-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff8f00]/30 focus:border-[#ff8f00] transition resize-none"
            />
          </div>

          {/* ══════════════════════════════════════════════════════
              BUTTON ACTIONS: BATAL & SIMPAN
          ══════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#ebeef2]">
            {/* Tombol Batal */}
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={submitting}
              className="h-[51px] w-[160px] sm:w-[171px] bg-[#ff8f00] hover:bg-[#e68100] text-white font-black text-lg rounded-[6px] transition cursor-pointer flex items-center justify-center shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              Batal
            </button>

            {/* Tombol Simpan */}
            <button
              type="submit"
              disabled={submitting}
              className="h-[51px] w-[160px] sm:w-[171px] bg-[#01923f] hover:bg-[#017834] text-white font-black text-lg rounded-[6px] transition cursor-pointer flex items-center justify-center shadow-xs active:scale-[0.98] disabled:opacity-50 gap-2"
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
    </div>
  );
};
