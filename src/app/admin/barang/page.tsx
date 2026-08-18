"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { AtkItemData } from "@/types/atk";

export default function AdminBarangPage() {
  const toast = useToast();

  const [items, setItems] = useState<AtkItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Form Modals
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<AtkItemData | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStock, setFormStock] = useState<number | "">("");
  const [formUnit, setFormUnit] = useState("pcs");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (isActiveFilter !== "") params.set("isActive", isActiveFilter);

      const res = await fetch(`/api/atk?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Fetch ATK items error:", err);
      toast.error("Gagal memuat data barang ATK");
    } finally {
      setLoading(false);
    }
  }, [page, search, isActiveFilter, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingItem(null);
    setFormName("");
    setFormDesc("");
    setFormStock("");
    setFormUnit("pcs");
    setErrors({});
  };

  const openEditModal = (item: AtkItemData) => {
    setModalMode("edit");
    setEditingItem(item);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormStock(item.stock);
    setFormUnit(item.unit);
    setErrors({});
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formName.trim()) newErrors.name = "Nama barang wajib diisi";
    if (formStock === "" || Number(formStock) < 0)
      newErrors.stock = "Stok tidak boleh negatif";
    if (!formUnit.trim()) newErrors.unit = "Satuan wajib diisi";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        stock: Number(formStock),
        unit: formUnit.trim(),
      };

      const url =
        modalMode === "create" ? "/api/atk" : `/api/atk/${editingItem?.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan barang");
        return;
      }

      toast.success(
        data.message ||
          (modalMode === "create"
            ? "Barang ATK berhasil ditambahkan"
            : "Barang ATK berhasil diperbarui")
      );
      setModalMode(null);
      fetchItems();
    } catch (err) {
      console.error("Save ATK error:", err);
      toast.error("Terjadi gangguan server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: AtkItemData) => {
    try {
      const res = await fetch(`/api/atk/${item.id}/status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah status barang");
        return;
      }
      toast.success(
        `Barang ${item.name} berhasil ${item.isActive ? "dinonaktifkan" : "diaktifkan"}`
      );
      fetchItems();
    } catch (err) {
      console.error("Toggle item status error:", err);
      toast.error("Gagal mengubah status barang");
    }
  };

  const unitOptions = [
    { value: "pcs", label: "pcs (Satuan)" },
    { value: "box", label: "box (Kotak)" },
    { value: "rim", label: "rim (Rim Kertas)" },
    { value: "pack", label: "pack (Pak)" },
    { value: "unit", label: "unit (Unit)" },
    { value: "lusin", label: "lusin (12 pcs)" },
    { value: "roll", label: "roll (Gulung)" },
  ];

  const columns: Column<AtkItemData>[] = [
    {
      header: "No",
      className: "w-12 text-center text-slate-400 text-xs",
      headerClassName: "text-center",
      accessor: (_row: AtkItemData, idx: number) => (page - 1) * 10 + idx + 1,
    },
    {
      header: "Nama Barang ATK",
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          {row.description && (
            <p className="text-xs text-slate-400 truncate max-w-xs">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Stok Tersedia",
      accessor: (row) => (
        <span
          className={`font-bold ${
            row.stock <= 5
              ? "text-rose-600 font-semibold"
              : "text-slate-900"
          }`}
        >
          {row.stock} {row.unit}
        </span>
      ),
    },
    {
      header: "Satuan",
      accessor: (row) => (
        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
          {row.unit}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge status={row.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      headerClassName: "text-right",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal(row)}
          >
            Edit
          </Button>
          <Button
            variant={row.isActive ? "danger" : "success"}
            size="sm"
            onClick={() => handleToggleStatus(row)}
          >
            {row.isActive ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Manajemen Barang ATK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola daftar persediaan barang alat tulis kantor, stok, dan ketersediaan barang.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Tambah Barang ATK
          </Button>
        </div>

        {/* Filters */}
        <Card title="Pencarian & Filter Barang">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Cari Barang"
                placeholder="Nama barang atau deskripsi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            <div>
              <Select
                label="Status Ketersediaan"
                value={isActiveFilter}
                onChange={(e) => {
                  setIsActiveFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "true", label: "Aktif Saja" },
                  { value: "false", label: "Nonaktif Saja" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card noPadding>
          <Table
            columns={columns}
            data={items}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => setPage(p)}
            emptyMessage="Belum ada data barang ATK yang sesuai."
          />
        </Card>
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <Modal
          isOpen={!!modalMode}
          onClose={() => setModalMode(null)}
          title={
            modalMode === "create"
              ? "Tambah Barang ATK Baru"
              : `Edit Barang: ${editingItem?.name}`
          }
          subtitle="Pastikan stok dan satuan sesuai dengan fisik di gudang."
          size="md"
        >
          <form onSubmit={handleSaveItem} className="space-y-4">
            <Input
              label="Nama Barang ATK"
              required
              placeholder="Contoh: Kertas A4 70gsm"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              error={errors.name}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Stok Barang"
                type="number"
                min="0"
                required
                placeholder="Contoh: 50"
                value={formStock}
                onChange={(e) => {
                  setFormStock(
                    e.target.value === "" ? "" : Number(e.target.value)
                  );
                  setErrors((prev) => ({ ...prev, stock: "" }));
                }}
                error={errors.stock}
              />

              <Select
                label="Satuan Barang"
                required
                value={formUnit}
                onChange={(e) => {
                  setFormUnit(e.target.value);
                  setErrors((prev) => ({ ...prev, unit: "" }));
                }}
                options={unitOptions}
                error={errors.unit}
              />
            </div>

            <Textarea
              label="Deskripsi / Catatan Tambahan"
              rows={3}
              placeholder="Spesifikasi merek, warna, atau catatan penggunaan..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setModalMode(null)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
              >
                {modalMode === "create" ? "Simpan Barang" : "Perbarui Barang"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
