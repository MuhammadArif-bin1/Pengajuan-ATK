"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { UserProfile } from "@/types/user";

export default function AdminKaryawanPage() {
  const toast = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "USER">("USER");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (isActiveFilter !== "") params.set("isActive", isActiveFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error("Gagal memuat data karyawan");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, isActiveFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("USER");
    setFormDepartment("");
    setFormPosition("");
    setErrors({});
  };

  const openEditModal = (user: UserProfile) => {
    setModalMode("edit");
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDepartment(user.department);
    setFormPosition(user.position);
    setErrors({});
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formName.trim()) newErrors.name = "Nama wajib diisi";
    if (!formEmail.trim()) newErrors.email = "Email wajib diisi";
    if (modalMode === "create" && (!formPassword || formPassword.length < 6)) {
      newErrors.password = "Password minimal 6 karakter";
    }
    if (!formDepartment.trim()) newErrors.department = "Departemen wajib diisi";
    if (!formPosition.trim()) newErrors.position = "Jabatan wajib diisi";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload =
        modalMode === "create"
          ? {
              name: formName.trim(),
              email: formEmail.trim(),
              password: formPassword,
              role: formRole,
              department: formDepartment.trim(),
              position: formPosition.trim(),
            }
          : {
              name: formName.trim(),
              email: formEmail.trim(),
              role: formRole,
              department: formDepartment.trim(),
              position: formPosition.trim(),
            };

      const url =
        modalMode === "create" ? "/api/users" : `/api/users/${editingUser?.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan data karyawan");
        return;
      }

      toast.success(
        data.message ||
          (modalMode === "create"
            ? "Karyawan baru berhasil ditambahkan"
            : "Data karyawan berhasil diperbarui")
      );
      setModalMode(null);
      fetchUsers();
    } catch (err) {
      console.error("Save user error:", err);
      toast.error("Terjadi gangguan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah status akun");
        return;
      }
      toast.success(
        `Akun ${user.name} berhasil ${user.isActive ? "dinonaktifkan" : "diaktifkan"}`
      );
      fetchUsers();
    } catch (err) {
      console.error("Toggle user status error:", err);
      toast.error("Gagal mengubah status akun");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword || newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    try {
      setIsResetting(true);
      const res = await fetch(`/api/users/${resetModalUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mereset password");
        return;
      }

      toast.success(`Password untuk ${resetModalUser.name} berhasil diubah`);
      setResetModalUser(null);
      setNewPassword("");
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Terjadi gangguan server");
    } finally {
      setIsResetting(false);
    }
  };

  const columns: Column<UserProfile>[] = [
    {
      header: "No",
      className: "w-12 text-center text-slate-400 text-xs",
      headerClassName: "text-center",
      accessor: (_row: UserProfile, idx: number) => (page - 1) * 10 + idx + 1,
    },
    {
      header: "Nama & Email",
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    {
      header: "Departemen",
      accessor: (row) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
          {row.department}
        </span>
      ),
    },
    {
      header: "Jabatan",
      accessor: (row) => (
        <span className="text-xs text-slate-700">{row.position}</span>
      ),
    },
    {
      header: "Role",
      accessor: (row) => <Badge status={row.role} />,
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
            variant="secondary"
            size="sm"
            onClick={() => {
              setResetModalUser(row);
              setNewPassword("");
            }}
          >
            Reset Pwd
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
              Manajemen Karyawan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola data akun karyawan, role wewenang, jabatan, dan status keaktifan user.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            Tambah Karyawan
          </Button>
        </div>

        {/* Filters */}
        <Card title="Pencarian & Filter Karyawan">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Input
                label="Cari Karyawan"
                placeholder="Nama, email, departemen..."
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
                label="Role Akses"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Role" },
                  { value: "ADMIN", label: "ADMIN" },
                  { value: "USER", label: "USER (Karyawan)" },
                ]}
              />
            </div>

            <div>
              <Select
                label="Status Akun"
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
            data={users}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => setPage(p)}
            emptyMessage="Belum ada data karyawan yang cocok."
          />
        </Card>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <Modal
          isOpen={!!modalMode}
          onClose={() => setModalMode(null)}
          title={
            modalMode === "create"
              ? "Tambah Karyawan Baru"
              : `Edit Data: ${editingUser?.name}`
          }
          subtitle="Isi kelengkapan data karyawan untuk kredensial portal."
          size="md"
        >
          <form onSubmit={handleSaveUser} className="space-y-4">
            <Input
              label="Nama Lengkap"
              required
              placeholder="Contoh: Budi Santoso"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              error={errors.name}
            />

            <Input
              label="Email Perusahaan"
              type="email"
              required
              placeholder="budi@company.com"
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={errors.email}
            />

            {modalMode === "create" && (
              <Input
                label="Password Akun"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={formPassword}
                onChange={(e) => {
                  setFormPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                error={errors.password}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Departemen / Divisi"
                required
                placeholder="Contoh: Keuangan"
                value={formDepartment}
                onChange={(e) => {
                  setFormDepartment(e.target.value);
                  setErrors((prev) => ({ ...prev, department: "" }));
                }}
                error={errors.department}
              />

              <Input
                label="Jabatan / Posisi"
                required
                placeholder="Contoh: Staff Keuangan"
                value={formPosition}
                onChange={(e) => {
                  setFormPosition(e.target.value);
                  setErrors((prev) => ({ ...prev, position: "" }));
                }}
                error={errors.position}
              />
            </div>

            <Select
              label="Role Hak Akses"
              required
              value={formRole}
              onChange={(e) =>
                setFormRole(e.target.value as "ADMIN" | "USER")
              }
              options={[
                { value: "USER", label: "USER (Karyawan Pemohon)" },
                { value: "ADMIN", label: "ADMIN (Pengelola Sistem)" },
              ]}
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
                {modalMode === "create"
                  ? "Simpan Karyawan"
                  : "Perbarui Data"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <Modal
          isOpen={!!resetModalUser}
          onClose={() => setResetModalUser(null)}
          title="Reset Password Karyawan"
          subtitle={`Akun: ${resetModalUser.name} (${resetModalUser.email})`}
          size="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="Password Baru"
              type="password"
              required
              placeholder="Masukkan password baru (min 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Password lama akan langsung digantikan dengan password baru ini."
            />

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setResetModalUser(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                isLoading={isResetting}
              >
                Setel Ulang Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
