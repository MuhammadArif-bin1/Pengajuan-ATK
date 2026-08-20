"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { AtkItemData } from "@/types/atk";

export default function BuatPengajuanPage() {
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState<{
    name: string;
    department: string;
    position: string;
  }>({
    name: "",
    department: "",
    position: "",
  });

  const [items, setItems] = useState<AtkItemData[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [loadingItems, setLoadingItems] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingItems(true);
        const [meRes, atkRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/atk?activeOnly=true"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setProfile({
            name: meData.user.name,
            department: meData.user.department,
            position: meData.user.position,
          });
        }

        if (atkRes.ok) {
          const atkData = await atkRes.json();
          setItems(atkData.data || []);
        }
      } catch (err) {
        console.error("Failed to load form data:", err);
        toast.error("Gagal memuat daftar barang ATK");
      } finally {
        setLoadingItems(false);
      }
    }
    loadInitialData();
  }, [toast]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!selectedItemId) {
      newErrors.atkItemId = "Silakan pilih barang ATK yang dibutuhkan";
    }

    if (!quantity || Number(quantity) <= 0) {
      newErrors.quantity = "Jumlah barang minimal 1";
    }

    if (!reason.trim()) {
      newErrors.reason = "Alasan / keperluan pengajuan wajib diisi";
    } else if (reason.trim().length < 5) {
      newErrors.reason = "Alasan pengajuan terlalu singkat (minimal 5 karakter)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atkItemId: selectedItemId,
          quantity: Number(quantity),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal membuat pengajuan");
        return;
      }

      toast.success("Pengajuan ATK berhasil dibuat dan menunggu persetujuan!");
      router.push("/user/pengajuan");
    } catch (err) {
      console.error("Submit request error:", err);
      toast.error("Terjadi gangguan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/user/dashboard"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                ← Kembali ke Dashboard
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Formulir Pengajuan ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Isi data kebutuhan barang alat tulis kantor untuk operasional kerja.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Auto-filled Employee Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Informasi Karyawan (Otomatis)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold">
                  Terkunci
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Nama</p>
                  <p className="text-xs font-semibold text-slate-800">
                    {profile.name || "..."}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Departemen</p>
                  <p className="text-xs font-semibold text-slate-800">
                    {profile.department || "..."}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Jabatan</p>
                  <p className="text-xs font-semibold text-slate-800">
                    {profile.position || "..."}
                  </p>
                </div>
              </div>
            </div>

            {/* ATK Item Selection */}
            <div>
              <Select
                label="Pilih Barang ATK"
                required
                placeholder={
                  loadingItems ? "Memuat data barang..." : "-- Pilih Barang ATK --"
                }
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setErrors((prev) => ({ ...prev, atkItemId: "" }));
                }}
                error={errors.atkItemId}
                options={items.map((item) => ({
                  value: item.id,
                  label: `${item.name} (Stok: ${item.stock} ${item.unit})`,
                }))}
              />

              {/* Item Info Box if Selected */}
              {selectedItem && (
                <div className="mt-2.5 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-indigo-900">
                      {selectedItem.name}
                    </span>
                    {selectedItem.description && (
                      <span className="text-indigo-600 block text-[11px]">
                        {selectedItem.description}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-indigo-500 uppercase font-semibold block">
                      Stok di Gudang
                    </span>
                    <span className="font-bold text-indigo-900 text-sm">
                      {selectedItem.stock} {selectedItem.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <Input
                label={`Jumlah yang Diminta ${
                  selectedItem ? `(${selectedItem.unit})` : ""
                }`}
                type="number"
                min="1"
                required
                placeholder="Contoh: 2"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setQuantity(val);
                  setErrors((prev) => ({ ...prev, quantity: "" }));
                }}
                error={errors.quantity}
                helperText="Masukkan jumlah kebutuhan yang diajukan"
              />
            </div>

            {/* Reason */}
            <div>
              <Textarea
                label="Alasan / Keperluan Pengajuan"
                required
                rows={4}
                placeholder="Jelaskan kebutuhan pengajuan ATK ini untuk keperluan tugas/divisi..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErrors((prev) => ({ ...prev, reason: "" }));
                }}
                error={errors.reason}
                helperText="Berikan keterangan yang jelas untuk mempercepat proses persetujuan Admin."
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link href="/user/dashboard">
                <Button variant="secondary" size="md" type="button">
                  Batal
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSubmitting}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                Kirim Pengajuan
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </UserLayout>
  );
}
