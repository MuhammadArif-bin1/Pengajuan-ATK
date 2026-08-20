"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface AtkItemAdminData {
  id: string;
  name: string;
  description?: string | null;
  stock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminStokPage() {
  const toast = useToast();

  const [items, setItems] = useState<AtkItemAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "ready" | "low" | "empty">("all");

  // Create / Edit Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AtkItemAdminData | null>(null);
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formStock, setFormStock] = useState("0");
  const [formDescription, setFormDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Quick Adjust Stock Modal State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockTargetItem, setStockTargetItem] = useState<AtkItemAdminData | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>("0");
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Delete Modals
  const [deleteTarget, setDeleteTarget] = useState<AtkItemAdminData | null>(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Items
  const fetchItems = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const res = await fetch("/api/atk?activeOnly=true");
        if (res.ok) {
          const data = await res.json();
          setItems(data.data || []);
        } else {
          toast.error("Gagal memuat data stok barang ATK");
        }
      } catch (err) {
        console.error("Fetch items error:", err);
        if (showLoading) toast.error("Terjadi kendala saat memuat data");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchItems(true);
  }, [fetchItems]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchItems(false);
    setIsRefreshing(false);
    toast.info("Data stok berhasil diperbarui");
  };

  // Metrics
  const readyCount = useMemo(() => items.filter((i) => i.stock > 5).length, [items]);
  const lowCount = useMemo(() => items.filter((i) => i.stock > 0 && i.stock <= 5).length, [items]);
  const emptyCount = useMemo(() => items.filter((i) => i.stock === 0).length, [items]);
  const totalUnits = useMemo(() => items.reduce((acc, curr) => acc + (curr.stock || 0), 0), [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchSearch =
        !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(search.toLowerCase()));

      let matchStock = true;
      if (stockStatusFilter === "ready") matchStock = i.stock > 5;
      else if (stockStatusFilter === "low") matchStock = i.stock > 0 && i.stock <= 5;
      else if (stockStatusFilter === "empty") matchStock = i.stock === 0;

      return matchSearch && matchStock;
    });
  }, [items, search, stockStatusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormUnit("pcs");
    setFormStock("0");
    setFormDescription("");
    setFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: AtkItemAdminData) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormUnit(item.unit || "pcs");
    setFormStock(String(item.stock));
    setFormDescription(item.description || "");
    setFormModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nama barang ATK wajib diisi");
      return;
    }
    if (!formUnit.trim()) {
      toast.error("Satuan barang wajib diisi");
      return;
    }

    const stockNum = parseInt(formStock.replace(/\D/g, ""), 10) || 0;
    setIsSaving(true);
    try {
      if (editingItem) {
        // UPDATE
        const res = await fetch(`/api/atk/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            unit: formUnit.trim(),
            stock: stockNum,
            description: formDescription.trim() || null,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Gagal memperbarui barang");

        toast.success(`Barang "${formName}" berhasil diperbarui!`);
      } else {
        // CREATE
        const res = await fetch("/api/atk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            unit: formUnit.trim(),
            stock: stockNum,
            description: formDescription.trim() || null,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Gagal menambahkan barang");

        toast.success(`Barang "${formName}" berhasil ditambahkan ke katalog!`);
      }

      setFormModalOpen(false);
      fetchItems(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan barang");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Quick Stock Modal
  const handleOpenStockModal = (item: AtkItemAdminData) => {
    setStockTargetItem(item);
    setNewStockValue(String(item.stock));
    setStockModalOpen(true);
  };

  // Save Quick Stock
  const handleSaveQuickStock = async () => {
    if (!stockTargetItem) return;
    const stockNum = parseInt(newStockValue.replace(/\D/g, ""), 10);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Stok harus berupa angka positif (minimal 0)");
      return;
    }

    setIsUpdatingStock(true);
    try {
      const res = await fetch(`/api/atk/${stockTargetItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: stockNum,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui stok");

      toast.success(`Stok "${stockTargetItem.name}" berhasil diubah menjadi ${stockNum} ${stockTargetItem.unit}!`);
      setStockModalOpen(false);
      fetchItems(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah stok");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Delete Single Item
  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/atk/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus barang");

      toast.success(`Barang "${deleteTarget.name}" berhasil dihapus`);
      setDeleteTarget(null);
      fetchItems(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete All Items
  const handleDeleteAllItems = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/atk", {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengosongkan katalog");

      toast.success("Semua data barang ATK berhasil dibersihkan");
      setDeleteAllModalOpen(false);
      fetchItems(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membersihkan katalog");
    } finally {
      setIsDeleting(false);
    }
  };

  // Columns definition
  const columns: Column<AtkItemAdminData>[] = [
    {
      header: "No",
      className: "w-12 text-slate-400 text-xs text-center",
      accessor: (_row, idx) => idx + 1,
    },
    {
      header: "Nama Barang ATK",
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs sm:text-sm">{row.name}</p>
          {row.description && (
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: "Satuan",
      className: "w-24 text-center",
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase">
          {row.unit || "pcs"}
        </span>
      ),
    },
    {
      header: "Ketersediaan Stok",
      className: "w-44 text-center",
      accessor: (row) => {
        const isReady = row.stock > 5;
        const isLow = row.stock > 0 && row.stock <= 5;
        const isEmpty = row.stock === 0;

        return (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-extrabold shadow-2xs ${
                isReady
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : isLow
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {row.stock} {row.unit}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {isReady ? "🟢 Tersedia" : isLow ? "🟡 Stok Menipis" : "🔴 Stok Habis"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Aksi",
      className: "w-44 text-right",
      headerClassName: "text-right",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Quick Adjust Stock */}
          <button
            type="button"
            onClick={() => handleOpenStockModal(row)}
            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-[#FF5500] text-[#FF5500] hover:text-white border border-orange-200 text-xs font-bold transition cursor-pointer"
            title="Ubah Angka Stok"
          >
            ± Stok
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Edit Barang"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Hapus Barang"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Manajemen Stok ATK</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF5500] border border-orange-200">
                Master Data
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tambah jenis barang baru, pantau ketersediaan, dan sesuaikan jumlah unit fisik di gudang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              onClick={handleManualRefresh}
              className="text-slate-700 hover:text-[#FF5500] hover:border-orange-300 font-semibold"
              leftIcon={
                <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Refresh
            </Button>

            {/* Clear All Items (Danger) */}
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteAllModalOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
                leftIcon={
                  <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                Kosongkan Semua
              </Button>
            )}

            {/* Add New Item Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="bg-[#FF5500] hover:bg-[#e04b00] text-white font-bold shadow-sm"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              + Tambah Barang ATK
            </Button>
          </div>
        </div>

        {/* ─── METRIC CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Total Jenis Barang</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{items.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Katalog terdaftar di sistem</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-xs font-semibold text-emerald-600">Stok Tersedia (&gt;5)</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{readyCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Siap didistribusikan</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-xs font-semibold text-amber-600">Stok Menipis (1-5)</p>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{lowCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Perlu pengadaan ulang</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-xs font-semibold text-rose-600">Stok Kosong (0)</p>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">{emptyCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tidak tersedia di gudang</p>
          </div>
        </div>

        {/* ─── FILTERS & SEARCH ─── */}
        <Card title="Pencarian & Filter Stok">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Cari Nama Barang"
                placeholder="Ketik nama alat tulis atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            <div>
              <Select
                label="Filter Status Stok"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                options={[
                  { value: "all", label: "Semua Ketersediaan" },
                  { value: "ready", label: "🟢 Stok Tersedia (> 5)" },
                  { value: "low", label: "🟡 Stok Menipis (1 - 5)" },
                  { value: "empty", label: "🔴 Stok Kosong (0)" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* ─── TABLE ─── */}
        <Card noPadding>
          <Table
            columns={columns}
            data={filteredItems}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            emptyMessage="Belum ada data barang ATK. Klik tombol + Tambah Barang ATK di atas untuk mulai memasukkan jenis barang."
          />

          {/* Table Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Unit Fisik Gudang: <b className="text-slate-800">{totalUnits} Unit</b></span>
            <span>Menampilkan <b>{filteredItems.length}</b> dari {items.length} jenis barang</span>
          </div>
        </Card>
      </div>

      {/* ─── MODAL 1: TAMBAH / EDIT BARANG ATK ─── */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingItem ? "Edit Data Barang ATK" : "Tambah Jenis Barang ATK Baru"}
        size="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Barang ATK <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Kertas HVS A4 80gr Sinar Dunia"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Satuan Standar <span className="text-red-500">*</span>
              </label>
              <Select
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                options={[
                  { value: "pcs", label: "Pcs (Buah)" },
                  { value: "rim", label: "Rim (Kertas)" },
                  { value: "box", label: "Box (Kotak)" },
                  { value: "pack", label: "Pack (Bungkus)" },
                  { value: "lusin", label: "Lusin (12 pcs)" },
                  { value: "roll", label: "Roll (Gulung)" },
                  { value: "set", label: "Set" },
                  { value: "lembar", label: "Lembar" },
                  { value: "botol", label: "Botol" },
                  { value: "buku", label: "Buku" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {editingItem ? "Jumlah Stok Saat Ini" : "Jumlah Stok Awal"} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi / Spesifikasi <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <Input
              placeholder="Contoh: Warna Putih, 1 Box isi 10 pcs..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="bg-[#FF5500] hover:bg-[#e04b00]"
            >
              {editingItem ? "Simpan Perubahan" : "+ Tambah ke Katalog"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: QUICK ADJUST STOCK ─── */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title="Sesuaikan Stok Fisik Barang"
        size="sm"
      >
        {stockTargetItem && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <p className="text-xs text-slate-400 font-medium">Barang:</p>
              <p className="text-sm font-bold text-slate-900">{stockTargetItem.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                Stok Sekarang: <b className="text-slate-900">{stockTargetItem.stock} {stockTargetItem.unit}</b>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masukkan Angka Stok Baru:
              </label>
              <Input
                type="number"
                min="0"
                value={newStockValue}
                onChange={(e) => setNewStockValue(e.target.value)}
                autoFocus
              />
            </div>

            {/* Quick shortcuts */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-400 self-center mr-1">Shortcut:</span>
              <button
                type="button"
                onClick={() => setNewStockValue("0")}
                className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 cursor-pointer"
              >
                Set 0 (Habis)
              </button>
              <button
                type="button"
                onClick={() => setNewStockValue(String((parseInt(newStockValue, 10) || 0) + 10))}
                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 cursor-pointer"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => setNewStockValue(String((parseInt(newStockValue, 10) || 0) + 50))}
                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 cursor-pointer"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => setNewStockValue(String((parseInt(newStockValue, 10) || 0) + 100))}
                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 cursor-pointer"
              >
                +100
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStockModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isUpdatingStock}
                onClick={handleSaveQuickStock}
                className="bg-[#FF5500] hover:bg-[#e04b00]"
              >
                Simpan Perubahan Stok
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 3: DELETE SINGLE ITEM CONFIRMATION ─── */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Barang ATK"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus barang <b>"{deleteTarget.name}"</b> dari katalog sistem?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteItem}
              >
                Ya, Hapus Barang
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 4: DELETE ALL ITEMS CONFIRMATION ─── */}
      <Modal
        isOpen={deleteAllModalOpen}
        onClose={() => setDeleteAllModalOpen(false)}
        title="Kosongkan Seluruh Katalog ATK"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
            ⚠️ <b>Peringatan:</b> Tindakan ini akan menghapus <b>seluruh {items.length} jenis barang</b> yang ada di sistem logistik.
          </div>
          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin mengosongkan katalog agar dapat diisi ulang secara manual?
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteAllModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteAllItems}
            >
              Ya, Kosongkan Semua
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
