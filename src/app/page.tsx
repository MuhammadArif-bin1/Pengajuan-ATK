"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import type { AtkItemData } from "@/types/atk";
import type { AtkRequestData } from "@/types/request";

export default function PublicUserPortalPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"form" | "history" | "catalog">(
    "form"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    department: "",
    position: "",
    atkItemId: "",
    quantity: 1,
    reason: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<any | null>(null);

  // Items State
  const [items, setItems] = useState<AtkItemData[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // History State
  const [requests, setRequests] = useState<AtkRequestData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<AtkRequestData | null>(
    null
  );

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

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/users/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (selectedDepartment) params.set("department", selectedDepartment);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, [statusFilter, searchQuery, selectedDepartment]);

  useEffect(() => {
    fetchItems();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchRequests();
    }
  }, [activeTab, fetchRequests]);

  const selectedItemObj = items.find((i) => i.id === formData.atkItemId);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.userName.trim()) errors.userName = "Nama wajib diisi";
    if (!formData.userEmail.trim()) {
      errors.userEmail = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      errors.userEmail = "Format email tidak valid";
    }
    if (!formData.department.trim())
      errors.department = "Departemen wajib diisi";
    if (!formData.position.trim()) errors.position = "Jabatan wajib diisi";
    if (!formData.atkItemId) errors.atkItemId = "Silakan pilih barang ATK";
    if (!formData.quantity || formData.quantity < 1)
      errors.quantity = "Jumlah minimal 1";
    if (selectedItemObj && formData.quantity > selectedItemObj.stock) {
      errors.quantity = `Melebihi stok (${selectedItemObj.stock} ${selectedItemObj.unit})`;
    }
    if (!formData.reason.trim())
      errors.reason = "Alasan keperluan wajib diisi";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengirim pengajuan");
      }

      toast.success("Pengajuan ATK berhasil dikirim!");
      setSubmittedSuccess(result.data);

      setFormData((prev) => ({
        ...prev,
        atkItemId: "",
        quantity: 1,
        reason: "",
      }));
      setFormErrors({});
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectFromCatalog = (itemId: string) => {
    setFormData((prev) => ({ ...prev, atkItemId: itemId }));
    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "MENUNGGU": return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">MENUNGGU</span>;
      case "DISETUJUI": return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800">DISETUJUI</span>;
      case "DIPROSES": return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-orange-100 text-orange-800">DIPROSES</span>;
      case "SELESAI": return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">SELESAI</span>;
      case "DITOLAK": return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-100 text-red-800">DITOLAK</span>;
      default: return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-100 text-gray-800">{s}</span>;
    }
  };

  const navTabs = [
    {
      key: "form" as const,
      label: "Form Pengajuan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      key: "history" as const,
      label: "Status Pengajuan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
      case "form": return "Form Pengajuan";
      case "history": return "Status Pengajuan";
      case "catalog": return "Katalog Barang ATK";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80 flex font-sans">

      {/* ─── SIDEBAR (Vibrant Orange #FF5500) ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

        {/* Bottom Link: Admin Login */}
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

        {/* ─── TOP NAVBAR HEADER ─── */}
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

          {/* ═══ TAB 1: FORM PENGAJUAN ═══ */}
          {activeTab === "form" && (
            <div className="space-y-6">
              {/* Success Alert Banner */}
              {submittedSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Pengajuan Berhasil Terkirim!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Pengajuan Anda untuk <b>{submittedSuccess.atkItem?.name}</b> ({submittedSuccess.quantity} {submittedSuccess.atkItem?.unit}) telah berhasil disimpan dan sedang menunggu persetujuan Admin.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSubmittedSuccess(null); setActiveTab("history"); }}
                    className="text-xs font-bold text-emerald-700 hover:underline shrink-0 cursor-pointer"
                  >
                    Lihat Status →
                  </button>
                </div>
              )}

              {/* Form Card */}
              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Formulir Pengajuan ATK</h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">Lengkapi data pemohon dan detail alat tulis kantor yang Anda butuhkan.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-6">
                  {/* Section 1: Data Pemohon */}
                  <div>
                    <span className="text-[11px] font-extrabold text-[#FF5500] uppercase tracking-widest block mb-3">
                      1. DATA PEMOHON (KARYAWAN)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Budi Santoso"
                          value={formData.userName}
                          onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            formErrors.userName ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {formErrors.userName && <p className="text-[11px] text-red-500 mt-1">{formErrors.userName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Email Perusahaan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="budi@company.com"
                          value={formData.userEmail}
                          onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            formErrors.userEmail ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {formErrors.userEmail && <p className="text-[11px] text-red-500 mt-1">{formErrors.userEmail}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Departemen / Divisi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Keuangan, HRD, IT"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            formErrors.department ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {formErrors.department && <p className="text-[11px] text-red-500 mt-1">{formErrors.department}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Jabatan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Staff Keuangan, Supervisor"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            formErrors.position ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {formErrors.position && <p className="text-[11px] text-red-500 mt-1">{formErrors.position}</p>}
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
                          Pilih Barang ATK <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.atkItemId}
                          onChange={(e) => setFormData({ ...formData, atkItemId: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            formErrors.atkItemId ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        >
                          <option value="">-- Pilih Barang dari Gudang --</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} — (Stok Tersedia: {item.stock} {item.unit})
                            </option>
                          ))}
                        </select>
                        {formErrors.atkItemId && <p className="text-[11px] text-red-500 mt-1">{formErrors.atkItemId}</p>}
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
                          Jumlah yang Dibutuhkan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedItemObj ? selectedItemObj.stock : undefined}
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                            formErrors.quantity ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {formErrors.quantity && <p className="text-[11px] text-red-500 mt-1">{formErrors.quantity}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Alasan & Keperluan Penggunaan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Jelaskan secara rinci alasan dan keperluan penggunaan ATK..."
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition resize-none ${
                            formErrors.reason ? "border-red-400 bg-red-50/20" : "border-gray-300"
                          }`}
                        />
                        {formErrors.reason && <p className="text-[11px] text-red-500 mt-1">{formErrors.reason}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] text-white text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
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

          {/* ═══ TAB 2: STATUS PENGAJUAN ═══ */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Daftar & Status Pengajuan ATK
                  </h1>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Pantau status pengajuan kebutuhan ATK Anda secara real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className="px-4 py-2 bg-[#FF5500] hover:bg-[#e04b00] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                >
                  + Buat Pengajuan Baru
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white border border-gray-200/70 rounded-2xl p-4 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Cari pemohon / barang ATK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 text-xs px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition"
                  >
                    <option value="">Semua Status</option>
                    <option value="MENUNGGU">MENUNGGU</option>
                    <option value="DISETUJUI">DISETUJUI</option>
                    <option value="DIPROSES">DIPROSES</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="DITOLAK">DITOLAK</option>
                  </select>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 text-xs px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition"
                  >
                    <option value="">Semua Departemen</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-2xs overflow-hidden">
                {loadingRequests ? (
                  <div className="py-16 text-center text-gray-400 text-xs font-medium">
                    Memuat daftar pengajuan...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 text-xs font-medium">
                    Belum ada data pengajuan ATK.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-slate-50/50">
                          <th className="text-left px-6 py-3.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">PEMOHON</th>
                          <th className="text-left px-6 py-3.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">BARANG DIAJUKAN</th>
                          <th className="text-left px-6 py-3.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">KEPERLUAN</th>
                          <th className="text-left px-6 py-3.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">TANGGAL</th>
                          <th className="text-left px-6 py-3.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">STATUS</th>
                          <th className="text-right px-6 py-3.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {requests.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900 text-xs">{row.user.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{row.user.department} • {row.user.position}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-800 text-xs">{row.atkItem.name}</p>
                              <p className="text-[11px] text-[#FF5500] font-bold mt-0.5">{row.quantity} {row.atkItem.unit}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-500 text-xs max-w-xs truncate" title={row.reason}>{row.reason}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-xs font-medium whitespace-nowrap">
                              {new Date(row.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-6 py-4">
                              {statusBadge(row.status)}
                              {row.status === "DITOLAK" && row.adminNote && (
                                <p className="text-[10px] text-red-500 font-medium mt-1">Catatan: {row.adminNote}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedRequest(row)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB 3: KATALOG BARANG ═══ */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Katalog Persediaan ATK
                </h1>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Daftar alat tulis kantor yang siap diajukan untuk operasional kerja.
                </p>
              </div>

              {loadingItems ? (
                <div className="py-16 text-center text-gray-400 text-xs font-medium">
                  Memuat katalog barang...
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs font-medium">
                  Belum ada data barang ATK di gudang.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((item) => (
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
                        <p className="text-xs text-gray-400 line-clamp-2">
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

      {/* Detail Modal */}
      {selectedRequest && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          title="Detail Pengajuan ATK"
          size="md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-200/80">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Pemohon:</span>
                <span className="font-bold text-gray-900">{selectedRequest.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Departemen / Jabatan:</span>
                <span className="font-semibold text-gray-800">
                  {selectedRequest.user.department} • {selectedRequest.user.position}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Barang Diajukan:</span>
                <span className="font-bold text-[#FF5500]">{selectedRequest.atkItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah:</span>
                <span className="font-bold text-gray-900">
                  {selectedRequest.quantity} {selectedRequest.atkItem.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status Saat Ini:</span>
                {statusBadge(selectedRequest.status)}
              </div>
            </div>

            <div>
              <span className="text-gray-500 text-xs block mb-1">Keperluan Pengajuan:</span>
              <p className="p-3 bg-white border border-gray-200 rounded-xl text-gray-700 text-xs leading-relaxed">
                {selectedRequest.reason}
              </p>
            </div>

            {selectedRequest.adminNote && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 block text-xs mb-0.5">Catatan Administrator:</span>
                <p className="text-amber-800 text-xs">{selectedRequest.adminNote}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
