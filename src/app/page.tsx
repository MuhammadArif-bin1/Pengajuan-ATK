"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { playNotificationSound } from "@/lib/notificationSound";

// --- Types ---
interface FormItemRow {
  id: string;
  itemName: string;
  quantity: string;
}

interface FormState {
  userName: string;
  department: string;
  position: string;
  items: FormItemRow[];
  reason: string;
}

interface SubmittedSuccessSummary {
  totalItems: number;
  itemList: Array<{ name: string; quantity: number; unit?: string }>;
}

export interface PortalNotificationItem {
  id: string;
  userName: string;
  department: string;
  position: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK" | "DIPROSES" | "SELESAI";
  adminNote: string | null;
  processedByName: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isPurchase: boolean;
}

const createInitialItems = (): FormItemRow[] => [
  { id: "item-1", itemName: "", quantity: "1" },
];

const INITIAL_FORM: FormState = {
  userName: "",
  department: "",
  position: "",
  items: createInitialItems(),
  reason: "",
};

// --- Helper Functions ---
function validateForm(
  data: FormState,
  itemErrorMessage: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.userName.trim()) errors.userName = "Nama lengkap pemohon wajib diisi";
  if (!data.department.trim()) errors.department = "Departemen/Divisi wajib diisi";
  if (!data.position.trim()) errors.position = "Jabatan pemohon wajib diisi";

  if (!data.items || data.items.length === 0) {
    errors.generalItems = "Minimal tambahkan 1 barang ATK";
  } else {
    data.items.forEach((itm, idx) => {
      if (!itm.itemName.trim()) {
        errors[`itemName_${itm.id}`] = itemErrorMessage || `Nama barang #${idx + 1} wajib diisi`;
      }
      const parsedQty = parseInt(String(itm.quantity).replace(/\D/g, ""), 10);
      if (!parsedQty || parsedQty < 1) {
        errors[`quantity_${itm.id}`] = "Jumlah minimal 1";
      }
    });
  }

  return errors;
}

const getRelativeTime = (isoString: string) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} mnt lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const days = Math.floor(hr / 24);
  return `${days} hari lalu`;
};

// --- Status Badge Helper ---
function StatusBadge({ status }: { status: PortalNotificationItem["status"] }) {
  switch (status) {
    case "DISETUJUI":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Disetujui
        </span>
      );
    case "DITOLAK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Ditolak
        </span>
      );
    case "DIPROSES":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Sedang Diproses
        </span>
      );
    case "SELESAI":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Selesai
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Menunggu Review
        </span>
      );
  }
}

// --- Sub-components ---
function SuccessAlert({
  title,
  summary,
  onClose,
}: {
  title: string;
  summary: SubmittedSuccessSummary;
  onClose: () => void;
}) {
  return (
    <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
          ✓
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-emerald-900">{title}</p>
          <div className="text-xs text-emerald-800 leading-relaxed">
            Permohonan untuk{" "}
            <b>{summary.totalItems} jenis barang</b> telah berhasil disimpan dan sedang menunggu persetujuan Admin:
            <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-emerald-900 font-medium">
              {summary.itemList.map((itm, i) => (
                <li key={i}>
                  <b>{itm.name}</b> ({itm.quantity} {itm.unit || "pcs"})
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-emerald-700">
              💡 Notifikasi otomatis akan muncul di pojok kanan atas saat Admin menyetujui atau menolak permohonan ini.
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline shrink-0 cursor-pointer"
      >
        ✕ Tutup
      </button>
    </div>
  );
}

function ApplicantFields({
  formData,
  errors,
  onChange,
}: {
  formData: FormState;
  errors: Record<string, string>;
  onChange: (field: keyof FormState, value: string) => void;
}) {
  return (
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
            value={formData.userName}
            onChange={(e) => onChange("userName", e.target.value)}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
              errors.userName ? "border-red-400 bg-red-50/20" : "border-gray-300"
            }`}
          />
          {errors.userName && (
            <p className="text-[11px] text-red-500 mt-1">{errors.userName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Departemen / Divisi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => onChange("department", e.target.value)}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
              errors.department ? "border-red-400 bg-red-50/20" : "border-gray-300"
            }`}
          />
          {errors.department && (
            <p className="text-[11px] text-red-500 mt-1">{errors.department}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Jabatan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => onChange("position", e.target.value)}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
              errors.position ? "border-red-400 bg-red-50/20" : "border-gray-300"
            }`}
          />
          {errors.position && (
            <p className="text-[11px] text-red-500 mt-1">{errors.position}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRowsSection({
  sectionTitle,
  items,
  errors,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: {
  sectionTitle: string;
  items: FormItemRow[];
  errors: Record<string, string>;
  onItemChange: (id: string, field: "itemName" | "quantity", value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-extrabold text-[#FF5500] uppercase tracking-widest">
          {sectionTitle}
        </span>
        <span className="text-[11px] text-gray-400 font-medium">
          Total {items.length} Barang
        </span>
      </div>

      <div className="space-y-3">
        {items.map((row, index) => {
          const itemError = errors[`itemName_${row.id}`];
          const qtyError = errors[`quantity_${row.id}`];

          return (
            <div
              key={row.id}
              className="p-3.5 sm:p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all duration-150 relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FF5500]/10 text-[#FF5500] inline-flex items-center justify-center text-[10px] font-extrabold">
                    {index + 1}
                  </span>
                  Barang {index + 1}
                </span>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(row.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-md transition cursor-pointer"
                    title="Hapus barang ini"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                {/* Nama Barang ATK */}
                <div className="sm:col-span-8">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Nama Barang ATK <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={row.itemName}
                    onChange={(e) => onItemChange(row.id, "itemName", e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                      itemError ? "border-red-400 bg-red-50/20" : "border-gray-300"
                    }`}
                  />
                  {itemError && <p className="text-[11px] text-red-500 mt-1">{itemError}</p>}
                </div>

                {/* Jumlah Kuantitas */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={row.quantity}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, "");
                      onItemChange(row.id, "quantity", onlyNums);
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition ${
                      qtyError ? "border-red-400 bg-red-50/20" : "border-gray-300"
                    }`}
                  />
                  {qtyError && <p className="text-[11px] text-red-500 mt-1">{qtyError}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Button Tambah Barang */}
      <div className="mt-3">
        <button
          type="button"
          onClick={onAddItem}
          className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[#FF5500]/40 hover:border-[#FF5500] bg-orange-50/40 hover:bg-orange-50/80 text-[#FF5500] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer group"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Barang Lainnya</span>
        </button>
      </div>
    </div>
  );
}

function SubmitButton({
  loading,
  loadingText,
  defaultText,
}: {
  loading: boolean;
  loadingText: string;
  defaultText: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] text-white text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        <span>{defaultText}</span>
      )}
    </button>
  );
}

export default function PublicUserPortalPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"request" | "purchase" | "history">("request");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form 1: Permintaan ATK dari Gudang
  const [requestForm, setRequestForm] = useState<FormState>(INITIAL_FORM);
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submittedRequestSuccess, setSubmittedRequestSuccess] = useState<SubmittedSuccessSummary | null>(null);

  // Form 2: Pengajuan Pembelian ATK Baru
  const [purchaseForm, setPurchaseForm] = useState<FormState>(INITIAL_FORM);
  const [purchaseErrors, setPurchaseErrors] = useState<Record<string, string>>({});
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [submittedPurchaseSuccess, setSubmittedPurchaseSuccess] = useState<SubmittedSuccessSummary | null>(null);

  // --- Real-time Notifications & Tracking State ---
  const [notifications, setNotifications] = useState<PortalNotificationItem[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRinging, setIsRinging] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>("");

  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const lastStatusesRef = useRef<Record<string, string>>({});
  const isInitialFetchRef = useRef(true);

  // Load saved IDs & preferences from localStorage on mount
  useEffect(() => {
    try {
      const storedSound = localStorage.getItem("portal_sound_enabled");
      if (storedSound !== null) {
        setSoundEnabled(storedSound === "true");
      }
      const storedUnread = localStorage.getItem("portal_unread_notif_ids");
      if (storedUnread) {
        setUnreadIds(new Set(JSON.parse(storedUnread)));
      }
      const storedStatuses = localStorage.getItem("portal_known_statuses");
      if (storedStatuses) {
        lastStatusesRef.current = JSON.parse(storedStatuses);
      }
    } catch (e) {
      console.warn("Storage init error:", e);
    }
  }, []);

  // Save unread IDs to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem("portal_unread_notif_ids", JSON.stringify(Array.from(unreadIds)));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }, [unreadIds]);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Portal Notifications & Statuses
  const fetchPortalNotifications = useCallback(async () => {
    try {
      // Get my submitted request IDs from localStorage
      let savedIds: string[] = [];
      try {
        const stored = localStorage.getItem("hasamitra_my_requests");
        if (stored) savedIds = JSON.parse(stored);
      } catch {}

      const params = new URLSearchParams();
      if (savedIds.length > 0) {
        params.set("ids", savedIds.join(","));
      } else {
        params.set("limit", "20");
      }

      const res = await fetch(`/api/requests/portal-notifications?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return;

      const items: PortalNotificationItem[] = data.data;
      setNotifications(items);

      // Check for real-time status changes
      if (!isInitialFetchRef.current) {
        let hasNewStatusChange = false;

        items.forEach((item) => {
          const prevStatus = lastStatusesRef.current[item.id];
          if (prevStatus && prevStatus !== item.status) {
            // Status changed!
            hasNewStatusChange = true;
            setUnreadIds((prev) => new Set([...prev, item.id]));

            if (item.status === "DISETUJUI") {
              toast.success(
                `🎉 Pengajuan Disetujui! Barang "${item.itemName}" (${item.quantity} ${item.unit}) telah disetujui Admin.`
              );
            } else if (item.status === "DITOLAK") {
              toast.error(
                `❌ Pengajuan Ditolak: Barang "${item.itemName}" ditolak Admin. ${
                  item.adminNote ? `Catatan: ${item.adminNote}` : ""
                }`
              );
            } else if (item.status === "SELESAI") {
              toast.info(`🏁 Pengajuan Selesai: Barang "${item.itemName}" telah siap diambil.`);
            } else if (item.status === "DIPROSES") {
              toast.info(`⚙️ Pengajuan Diproses: Barang "${item.itemName}" sedang diproses Admin.`);
            }
          }
        });

        if (hasNewStatusChange) {
          if (soundEnabled) {
            playNotificationSound();
          }
          setIsRinging(true);
          setTimeout(() => setIsRinging(false), 2500);
        }
      }

      // Update known statuses mapping
      const newStatusMap: Record<string, string> = {};
      items.forEach((it) => {
        newStatusMap[it.id] = it.status;
      });
      lastStatusesRef.current = newStatusMap;
      try {
        localStorage.setItem("portal_known_statuses", JSON.stringify(newStatusMap));
      } catch {}

      isInitialFetchRef.current = false;
    } catch (err) {
      console.warn("Fetch portal notifications error:", err);
    }
  }, [toast, soundEnabled]);

  // Polling every 5 seconds & on window focus
  useEffect(() => {
    fetchPortalNotifications();
    const interval = setInterval(fetchPortalNotifications, 5000);
    const handleFocus = () => fetchPortalNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchPortalNotifications]);

  const markAllNotificationsRead = () => {
    setUnreadIds(new Set());
  };

  const markNotificationRead = (id: string) => {
    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Helper to save new request IDs into localStorage
  const trackSubmittedRequestIds = (newIds: string[]) => {
    try {
      const stored = localStorage.getItem("hasamitra_my_requests");
      const existing: string[] = stored ? JSON.parse(stored) : [];
      const combined = Array.from(new Set([...newIds, ...existing]));
      localStorage.setItem("hasamitra_my_requests", JSON.stringify(combined));
      fetchPortalNotifications();
    } catch (e) {
      console.warn("Tracking save error:", e);
    }
  };

  // Item List Helpers for Form 1
  const handleRequestItemChange = (id: string, field: "itemName" | "quantity", value: string) => {
    setRequestForm((prev) => ({
      ...prev,
      items: prev.items.map((itm) => (itm.id === id ? { ...itm, [field]: value } : itm)),
    }));
  };

  const handleAddRequestItem = () => {
    setRequestForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, itemName: "", quantity: "1" },
      ],
    }));
  };

  const handleRemoveRequestItem = (id: string) => {
    setRequestForm((prev) => ({
      ...prev,
      items: prev.items.filter((itm) => itm.id !== id),
    }));
  };

  // Item List Helpers for Form 2
  const handlePurchaseItemChange = (id: string, field: "itemName" | "quantity", value: string) => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: prev.items.map((itm) => (itm.id === id ? { ...itm, [field]: value } : itm)),
    }));
  };

  const handleAddPurchaseItem = () => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, itemName: "", quantity: "1" },
      ],
    }));
  };

  const handleRemovePurchaseItem = (id: string) => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: prev.items.filter((itm) => itm.id !== id),
    }));
  };

  // Handlers for Form 1 Submit
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(requestForm, "Nama barang ATK wajib diisi");
    if (Object.keys(errors).length > 0) {
      setRequestErrors(errors);
      return;
    }
    setRequestErrors({});

    setSubmittingRequest(true);
    try {
      const payloadItems = requestForm.items.map((itm) => ({
        itemName: itm.itemName.trim(),
        quantity: parseInt(String(itm.quantity).replace(/\D/g, ""), 10) || 1,
      }));

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: requestForm.userName.trim(),
          department: requestForm.department.trim(),
          position: requestForm.position.trim(),
          reason: requestForm.reason.trim(),
          items: payloadItems,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengirim pengajuan");
      }

      toast.success(`Pengajuan ${payloadItems.length} barang ATK berhasil dikirim ke Admin!`);

      const rawItems = Array.isArray(result.items)
        ? result.items
        : Array.isArray(result.data)
        ? result.data
        : [result.data];

      const createdIds = rawItems.map((r: any) => r?.id).filter(Boolean);
      if (createdIds.length > 0) {
        trackSubmittedRequestIds(createdIds);
      }

      setSubmittedRequestSuccess({
        totalItems: payloadItems.length,
        itemList: rawItems.map((r: any, idx: number) => ({
          name: r?.atkItem?.name || payloadItems[idx]?.itemName || "Barang ATK",
          quantity: r?.quantity || payloadItems[idx]?.quantity || 1,
          unit: r?.atkItem?.unit || "pcs",
        })),
      });

      setRequestForm((prev) => ({
        ...prev,
        items: createInitialItems(),
        reason: "",
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kendala saat mengirim pengajuan";
      toast.error(message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Handlers for Form 2 Submit
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(purchaseForm, "Nama barang ATK yang ingin dibeli wajib diisi");
    if (Object.keys(errors).length > 0) {
      setPurchaseErrors(errors);
      return;
    }
    setPurchaseErrors({});

    setSubmittingPurchase(true);
    try {
      const payloadItems = purchaseForm.items.map((itm) => ({
        itemName: itm.itemName.trim(),
        quantity: parseInt(String(itm.quantity).replace(/\D/g, ""), 10) || 1,
      }));

      const res = await fetch("/api/requests/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: purchaseForm.userName.trim(),
          department: purchaseForm.department.trim(),
          position: purchaseForm.position.trim(),
          reason: purchaseForm.reason.trim(),
          items: payloadItems,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengirim permohonan pembelian");
      }

      toast.success(`Pengajuan pembelian ${payloadItems.length} barang ATK berhasil dikirim!`);

      const rawItems = Array.isArray(result.items)
        ? result.items
        : Array.isArray(result.data)
        ? result.data
        : [result.data];

      const createdIds = rawItems.map((r: any) => r?.id).filter(Boolean);
      if (createdIds.length > 0) {
        trackSubmittedRequestIds(createdIds);
      }

      setSubmittedPurchaseSuccess({
        totalItems: payloadItems.length,
        itemList: rawItems.map((r: any, idx: number) => ({
          name: r?.atkItem?.name || payloadItems[idx]?.itemName || "Barang ATK",
          quantity: r?.quantity || payloadItems[idx]?.quantity || 1,
          unit: r?.atkItem?.unit || "pcs",
        })),
      });

      setPurchaseForm((prev) => ({
        ...prev,
        items: createInitialItems(),
        reason: "",
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kendala saat mengirim permohonan";
      toast.error(message);
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
    {
      key: "history" as const,
      label: "Status & Riwayat Pengajuan",
      badge: unreadIds.size > 0 ? unreadIds.size : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const currentTabLabel =
    navTabs.find((tab) => tab.key === activeTab)?.label || "Form Pengajuan";

  // Filtered Notifications for the History Tab
  const filteredHistory = notifications.filter((item) => {
    const matchSearch =
      !historySearch ||
      item.userName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.itemName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.department.toLowerCase().includes(historySearch.toLowerCase());

    const matchStatus = !historyFilterStatus || item.status === historyFilterStatus;
    return matchSearch && matchStatus;
  });

  const unreadCount = unreadIds.size;

  return (
    <div className="min-h-screen bg-gray-50/80 flex font-sans">
      {/* --- MOBILE BACKDROP --- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
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
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Tutup Menu"
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-white text-[#FF5500] shadow-md font-bold"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={isActive ? "text-[#FF5500]" : "text-white"}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
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

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer transition"
              aria-label="Buka Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="hidden sm:flex items-center gap-1 text-slate-400">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Portal Karyawan</span>
              </span>
              <svg className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-bold bg-slate-100/90 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80">
                {currentTabLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* ─── NOTIFICATION BELL BUTTON ─── */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen((prev) => !prev)}
                className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-150 cursor-pointer ${
                  notifDropdownOpen
                    ? "bg-orange-50 border-[#FF5500] text-[#FF5500]"
                    : "border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                } ${isRinging ? "animate-bounce" : ""}`}
                aria-label="Lihat Notifikasi Pengajuan"
                title="Notifikasi Status Pengajuan"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {/* Badge Count */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white shadow-md animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Popover Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#FF5500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="text-xs font-bold tracking-wide">Notifikasi Status Pengajuan</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle Sound */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !soundEnabled;
                          setSoundEnabled(next);
                          try {
                            localStorage.setItem("portal_sound_enabled", String(next));
                          } catch {}
                        }}
                        className="text-white/70 hover:text-white text-xs"
                        title={soundEnabled ? "Suara Aktif" : "Suara Senyap"}
                      >
                        {soundEnabled ? "🔊" : "🔇"}
                      </button>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-[11px] font-semibold text-orange-300 hover:text-white underline cursor-pointer"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <p className="text-2xl mb-1">📭</p>
                        <p className="font-semibold text-slate-600">Belum ada notifikasi</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Status pengajuan yang Anda kirim akan muncul di sini.
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((item) => {
                        const isUnread = unreadIds.has(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => markNotificationRead(item.id)}
                            className={`p-3.5 text-xs transition cursor-pointer hover:bg-slate-50 ${
                              isUnread ? "bg-orange-50/40" : "bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-[#FF5500] shrink-0" />
                                )}
                                <span>{item.itemName}</span>
                                <span className="text-slate-400 font-normal">
                                  ({item.quantity} {item.unit})
                                </span>
                              </div>
                              <StatusBadge status={item.status} />
                            </div>

                            <div className="text-[11px] text-slate-500 space-y-1">
                              <p>
                                Pemohon: <b>{item.userName}</b> • {item.department}
                              </p>

                              {/* Admin Notes if Approved/Rejected */}
                              {item.adminNote && (
                                <div
                                  className={`p-2 rounded-lg text-[11px] font-medium leading-relaxed ${
                                    item.status === "DITOLAK"
                                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  }`}
                                >
                                  <b>Catatan Admin:</b> {item.adminNote}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span>{item.isPurchase ? "Pengadaan Baru" : "Permintaan Gudang"}</span>
                                <span>{getRelativeTime(item.updatedAt || item.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("history");
                        setNotifDropdownOpen(false);
                      }}
                      className="text-xs font-bold text-[#FF5500] hover:text-[#e04b00] hover:underline cursor-pointer"
                    >
                      Lihat Semua Riwayat & Status Pengajuan →
                    </button>
                  </div>
                </div>
              )}
            </div>

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

        {/* --- PAGE CONTENT --- */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: FORM PENGAJUAN PERMINTAAN ATK GUDANG */}
          {activeTab === "request" && (
            <div className="space-y-6">
              {submittedRequestSuccess && (
                <SuccessAlert
                  title="Pengajuan Berhasil Terkirim!"
                  summary={submittedRequestSuccess}
                  onClose={() => setSubmittedRequestSuccess(null)}
                />
              )}

              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Formulir Pengajuan ATK</h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Lengkapi data pemohon dan detail alat tulis kantor yang Anda butuhkan untuk operasional kerja.
                  </p>
                </div>

                <form onSubmit={handleRequestSubmit} className="p-6 sm:p-8 space-y-6">
                  {/* Section 1: Data Pemohon */}
                  <ApplicantFields
                    formData={requestForm}
                    errors={requestErrors}
                    onChange={(field, value) =>
                      setRequestForm((prev) => ({ ...prev, [field]: value }))
                    }
                  />

                  <hr className="border-gray-100" />

                  {/* Section 2: Detail Barang (Multi-item) */}
                  <ItemRowsSection
                    sectionTitle="2. DETAIL BARANG YANG DIAJUKAN"
                    items={requestForm.items}
                    errors={requestErrors}
                    onItemChange={handleRequestItemChange}
                    onAddItem={handleAddRequestItem}
                    onRemoveItem={handleRemoveRequestItem}
                  />

                  {/* Section 3: Catatan */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Catatan <span className="text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan catatan jika diperlukan (opsional)..."
                      value={requestForm.reason}
                      onChange={(e) =>
                        setRequestForm((prev) => ({ ...prev, reason: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <SubmitButton
                      loading={submittingRequest}
                      loadingText="Mengirim Pengajuan..."
                      defaultText={`Kirim Pengajuan ATK (${requestForm.items.length} Barang)`}
                    />
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: FORM PENGAJUAN PEMBELIAN ATK BARU */}
          {activeTab === "purchase" && (
            <div className="space-y-6">
              {submittedPurchaseSuccess && (
                <SuccessAlert
                  title="Pengajuan Pembelian Berhasil Terkirim!"
                  summary={submittedPurchaseSuccess}
                  onClose={() => setSubmittedPurchaseSuccess(null)}
                />
              )}

              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Formulir Pengajuan Pembelian ATK</h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Ajukan permohonan pengadaan atau pembelian barang alat tulis kantor baru.
                  </p>
                </div>

                <form onSubmit={handlePurchaseSubmit} className="p-6 sm:p-8 space-y-6">
                  {/* Section 1: Data Pemohon */}
                  <ApplicantFields
                    formData={purchaseForm}
                    errors={purchaseErrors}
                    onChange={(field, value) =>
                      setPurchaseForm((prev) => ({ ...prev, [field]: value }))
                    }
                  />

                  <hr className="border-gray-100" />

                  {/* Section 2: Detail Pembelian (Multi-item) */}
                  <ItemRowsSection
                    sectionTitle="2. DETAIL BARANG PEMBELIAN"
                    items={purchaseForm.items}
                    errors={purchaseErrors}
                    onItemChange={handlePurchaseItemChange}
                    onAddItem={handleAddPurchaseItem}
                    onRemoveItem={handleRemovePurchaseItem}
                  />

                  {/* Section 3: Alasan & Keperluan Penggunaan */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Alasan & Keperluan Penggunaan <span className="text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan keperluan penggunaan ATK jika diperlukan (opsional)..."
                      value={purchaseForm.reason}
                      onChange={(e) =>
                        setPurchaseForm((prev) => ({ ...prev, reason: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <SubmitButton
                      loading={submittingPurchase}
                      loadingText="Memproses Permohonan..."
                      defaultText={`Kirim Pengajuan Pembelian ATK (${purchaseForm.items.length} Barang)`}
                    />
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: STATUS & RIWAYAT PENGAJUAN (LIVE TRACKING) */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Status & Riwayat Pengajuan</h2>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      Pantau proses persetujuan dan riwayat pengajuan ATK Anda secara real-time.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchPortalNotifications}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5500] hover:text-[#e04b00] bg-orange-50/70 hover:bg-orange-100/70 px-3.5 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Segarkan Status</span>
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Cari Berdasarkan Nama / Barang
                    </label>
                    <input
                      type="text"
                      placeholder="Ketik nama karyawan atau nama barang..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Filter Status
                    </label>
                    <select
                      value={historyFilterStatus}
                      onChange={(e) => setHistoryFilterStatus(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition cursor-pointer"
                    >
                      <option value="">Semua Status</option>
                      <option value="MENUNGGU">Menunggu Review</option>
                      <option value="DISETUJUI">Disetujui</option>
                      <option value="DIPROSES">Sedang Diproses</option>
                      <option value="SELESAI">Selesai</option>
                      <option value="DITOLAK">Ditolak</option>
                    </select>
                  </div>
                </div>

                {/* Tracking List */}
                <div className="divide-y divide-gray-100">
                  {filteredHistory.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <p className="text-3xl mb-2">📋</p>
                      <p className="font-bold text-slate-700 text-sm">Tidak ada data pengajuan ditemukan</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {historySearch || historyFilterStatus
                          ? "Coba ubah kata kunci pencarian atau reset filter status."
                          : "Silakan isi dan kirim formulir pengajuan terlebih dahulu untuk melihat riwayat status."}
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-extrabold shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span>{item.itemName}</span>
                                <span className="text-xs font-semibold text-slate-500">
                                  ({item.quantity} {item.unit})
                                </span>
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Pemohon: <b>{item.userName}</b> • {item.department} ({item.position})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <StatusBadge status={item.status} />
                            <span className="text-[11px] text-slate-400">
                              {getRelativeTime(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Reason / Catatan Pengajuan */}
                        {item.reason && (
                          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wider mb-0.5">
                              Keperluan Penggunaan:
                            </span>
                            {item.reason}
                          </div>
                        )}

                        {/* Admin Feedback Box */}
                        {item.adminNote && (
                          <div
                            className={`p-3.5 rounded-xl text-xs font-medium leading-relaxed border ${
                              item.status === "DITOLAK"
                                ? "bg-rose-50 border-rose-200 text-rose-900"
                                : "bg-emerald-50 border-emerald-200 text-emerald-900"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              <span>
                                {item.status === "DITOLAK" ? "❌ Alasan Penolakan dari Admin:" : "✓ Catatan Persetujuan Admin:"}
                              </span>
                            </div>
                            <p className="text-xs">{item.adminNote}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- FLOATING TELEGRAM LOGO BUTTON --- */}
      <aside aria-label="Telegram" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
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
