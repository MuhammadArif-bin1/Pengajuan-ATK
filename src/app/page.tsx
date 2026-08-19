"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function PublicUserPortalPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"request" | "purchase">("request");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form 1: Permintaan ATK dari Gudang
  const [requestForm, setRequestForm] = useState<{
    userName: string;
    department: string;
    position: string;
    itemName: string;
    quantity: string | number;
    reason: string;
  }>({
    userName: "",
    department: "",
    position: "",
    itemName: "",
    quantity: "1",
    reason: "",
  });
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submittedRequestSuccess, setSubmittedRequestSuccess] = useState<any | null>(null);

  // Form 2: Pengajuan Pembelian ATK Baru
  const [purchaseForm, setPurchaseForm] = useState<{
    userName: string;
    department: string;
    position: string;
    itemName: string;
    quantity: string | number;
    reason: string;
  }>({
    userName: "",
    department: "",
    position: "",
    itemName: "",
    quantity: "1",
    reason: "",
  });
  const [purchaseErrors, setPurchaseErrors] = useState<Record<string, string>>({});
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [submittedPurchaseSuccess, setSubmittedPurchaseSuccess] = useState<any | null>(null);

  // Validation Form 1
  const validateRequestForm = () => {
    const errors: Record<string, string> = {};
    if (!requestForm.userName.trim()) errors.userName = "Nama lengkap pemohon wajib diisi";
    if (!requestForm.department.trim()) errors.department = "Departemen/Divisi wajib diisi";
    if (!requestForm.position.trim()) errors.position = "Jabatan pemohon wajib diisi";
    if (!requestForm.itemName.trim()) errors.itemName = "Nama barang ATK wajib diisi";

    const parsedQty = parseInt(String(requestForm.quantity).replace(/\D/g, ""), 10);
    if (!parsedQty || parsedQty < 1) errors.quantity = "Jumlah minimal 1";

    setRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRequestForm()) return;

    setSubmittingRequest(true);
    try {
      const parsedQty = parseInt(String(requestForm.quantity).replace(/\D/g, ""), 10) || 1;
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestForm,
          quantity: parsedQty,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengirim pengajuan");
      }

      toast.success("Pengajuan permintaan ATK berhasil dikirim ke Admin!");
      setSubmittedRequestSuccess(result.data);

      setRequestForm((prev) => ({
        ...prev,
        itemName: "",
        quantity: "1",
        reason: "",
      }));
      setRequestErrors({});
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

    const parsedQty = parseInt(String(purchaseForm.quantity).replace(/\D/g, ""), 10);
    if (!parsedQty || parsedQty < 1) errors.quantity = "Jumlah pembelian minimal 1";

    setPurchaseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePurchaseForm()) return;

    setSubmittingPurchase(true);
    try {
      const parsedQty = parseInt(String(purchaseForm.quantity).replace(/\D/g, ""), 10) || 1;
      const res = await fetch("/api/requests/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...purchaseForm,
          quantity: parsedQty,
        }),
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
        quantity: "1",
        reason: "",
      }));
      setPurchaseErrors({});
    } catch (err: any) {
      toast.error(err.message || "Terjadi kendala saat mengirim permohonan");
    } finally {
      setSubmittingPurchase(false);
    }
  };

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
  ];

  const getBreadcrumb = () => {
    switch (activeTab) {
      case "request":
        return "Form Pengajuan";
      case "purchase":
        return "Pengajuan Pembelian ATK";
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
        {/* ─── TOP NAVBAR HEADER (Portal Karyawan) ─── */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer transition"
            >
              <span className="sr-only">Buka Menu</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1 hidden sm:flex">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Portal Karyawan</span>
              </span>
              <svg className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-bold text-slate-900 bg-slate-100/90 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80">
                {getBreadcrumb()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Status Online Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Sistem Online</span>
            </div>

            {/* Portal Admin Button */}
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-orange-50/60 hover:border-[#FF5500]/40 text-slate-700 hover:text-[#FF5500] text-xs font-bold transition-all shadow-2xs cursor-pointer group"
            >
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF5500] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Portal Admin</span>
              <svg className="w-3 h-3 text-slate-400 group-hover:text-[#FF5500] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nama Barang ATK <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder=""
                          value={requestForm.itemName}
                          onChange={(e) => setRequestForm({ ...requestForm, itemName: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            requestErrors.itemName ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {requestErrors.itemName && <p className="text-[11px] text-red-500 mt-1">{requestErrors.itemName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Jumlah yang Dibutuhkan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder=""
                          value={requestForm.quantity}
                          onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            requestErrors.quantity ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {requestErrors.quantity && <p className="text-[11px] text-red-500 mt-1">{requestErrors.quantity}</p>}
                      </div>


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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nama Barang ATK <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder=""
                          value={purchaseForm.itemName}
                          onChange={(e) =>
                            setPurchaseForm({ ...purchaseForm, itemName: e.target.value })
                          }
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            purchaseErrors.itemName
                              ? "border-red-400 bg-red-50/20"
                              : "border-gray-300"
                          }`}
                        />
                        {purchaseErrors.itemName && (
                          <p className="text-[11px] text-red-500 mt-1">
                            {purchaseErrors.itemName}
                          </p>
                        )}
                      </div>

                      {/* Jumlah Kuantitas */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Jumlah yang Dibutuhkan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder=""
                          value={purchaseForm.quantity}
                          onChange={(e) =>
                            setPurchaseForm({
                              ...purchaseForm,
                              quantity: e.target.value,
                            })
                          }
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
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


        </main>
      </div>

      {/* ─── FLOATING TELEGRAM LOGO BUTTON (Portal Karyawan) ─── */}
      <aside aria-label="Telegram" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Label / Bubble Text Diatas Logo */}
        <a
          href="https://t.me/DennyXIX"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/95 hover:bg-white text-slate-800 hover:text-[#229ED9] text-[11px] sm:text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md hover:shadow-lg border border-slate-200/90 transition-all flex items-center gap-1.5 cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>fast track? Hubungi Admin</span>
          <span className="text-[#229ED9] text-xs">💬</span>
        </a>

        {/* Circular Logo Button */}
        <a
          href="https://t.me/DennyXIX"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Telegram"
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#229ED9] hover:bg-[#1b8ec5] text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group shrink-0"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
        </a>
      </aside>
    </div>
  );
}
