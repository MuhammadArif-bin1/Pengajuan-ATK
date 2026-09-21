"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface FastTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FastTrackModal: React.FC<FastTrackModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();

  const [applicantName, setApplicantName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !department.trim() || !itemName.trim()) {
      toast.error("Mohon lengkapi data nama, departemen, dan nama barang.");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      toast.error("Jumlah barang minimal 1.");
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
          items: [
            {
              itemName: itemName.trim(),
              quantity: qty,
            },
          ],
          reason: `[FAST TRACK] ${reason.trim() || "Kebutuhan mendesak operasional"}`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal mengirim permohonan Fast Track");
        return;
      }

      toast.success("🚀 Permohonan Fast Track berhasil diajukan ke antrian!");
      // Reset form
      setItemName("");
      setQuantity("1");
      setReason("");
      onClose();
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala saat mengirim permohonan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fast Track Pengajuan ATK"
      subtitle="Permohonan Kilat untuk Kebutuhan Mendesak"
      size="md"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#38BDF8] hover:bg-[#0EA5E9] rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : "Kirim Pengajuan Kilat"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Pemohon <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="cth. Budi Pratama"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Departemen / Divisi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="cth. Operasional / TI"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Barang ATK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="cth. Kertas A4 70gr"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Alasan Pengajuan Kilat
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan kebutuhan mendesak..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] transition resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
