// ===========================================
// Zod Validation Schemas
// ===========================================

import { z } from "zod";

// ===========================================
// Sanitization Helpers (XSS Protection)
// ===========================================

export function sanitizeText(val: string): string {
  if (typeof val !== "string") return val;
  return val.replace(/<[^>]*>?/gm, "").trim();
}

export function sanitizeOptionalText(val?: string | null): string | null | undefined {
  if (val === undefined) return undefined;
  if (val === null) return null;
  return sanitizeText(val);
}

// ===========================================
// Auth Validation
// ===========================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// ===========================================
// User Validation
// ===========================================

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .transform(sanitizeText),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
  role: z.enum(["ADMIN", "USER"], {
    errorMap: () => ({ message: "Role harus ADMIN atau USER" }),
  }),
  department: z
    .string()
    .min(1, "Departemen wajib diisi")
    .max(100, "Departemen maksimal 100 karakter")
    .transform(sanitizeText),
  position: z
    .string()
    .min(1, "Jabatan wajib diisi")
    .max(100, "Jabatan maksimal 100 karakter")
    .transform(sanitizeText),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .transform(sanitizeText)
    .optional(),
  email: z.string().email("Format email tidak valid").optional(),
  department: z
    .string()
    .min(1, "Departemen wajib diisi")
    .max(100, "Departemen maksimal 100 karakter")
    .transform(sanitizeText)
    .optional(),
  position: z
    .string()
    .min(1, "Jabatan wajib diisi")
    .max(100, "Jabatan maksimal 100 karakter")
    .transform(sanitizeText)
    .optional(),
  role: z
    .enum(["ADMIN", "USER"], {
      errorMap: () => ({ message: "Role harus ADMIN atau USER" }),
    })
    .optional(),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
});

// ===========================================
// ATK Item Validation
// ===========================================

export const createAtkItemSchema = z.object({
  name: z
    .string()
    .min(1, "Nama barang wajib diisi")
    .max(100, "Nama barang maksimal 100 karakter")
    .transform(sanitizeText),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .nullable()
    .transform(sanitizeOptionalText),
  stock: z
    .number()
    .int("Stok harus berupa angka bulat")
    .min(0, "Stok tidak boleh negatif"),
  unit: z
    .string()
    .min(1, "Satuan wajib diisi")
    .max(20, "Satuan maksimal 20 karakter")
    .transform(sanitizeText),
});

export const updateAtkItemSchema = z.object({
  name: z
    .string()
    .min(1, "Nama barang wajib diisi")
    .max(100, "Nama barang maksimal 100 karakter")
    .transform(sanitizeText)
    .optional(),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .nullable()
    .transform(sanitizeOptionalText),
  stock: z
    .number()
    .int("Stok harus berupa angka bulat")
    .min(0, "Stok tidak boleh negatif")
    .optional(),
  unit: z
    .string()
    .min(1, "Satuan wajib diisi")
    .max(20, "Satuan maksimal 20 karakter")
    .transform(sanitizeText)
    .optional(),
});

// ===========================================
// ATK Request Validation
// ===========================================

export const createRequestSchema = z.object({
  atkItemId: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z
    .number()
    .int("Jumlah harus berupa angka bulat")
    .min(1, "Jumlah minimal 1"),
  reason: z
    .string()
    .max(500, "Alasan maksimal 500 karakter")
    .optional()
    .default("")
    .transform(sanitizeText),
  // Optional public employee fields
  userName: z
    .string()
    .min(1, "Nama karyawan wajib diisi")
    .optional()
    .transform((v) => (v ? sanitizeText(v) : undefined)),
  userEmail: z.string().optional(),
  department: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v) : undefined)),
  position: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v) : undefined)),
});

export const createPublicRequestSchema = z.object({
  userName: z
    .string()
    .min(1, "Nama karyawan wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .transform(sanitizeText),
  userEmail: z.string().optional(),
  department: z
    .string()
    .min(1, "Departemen/divisi wajib diisi")
    .max(100, "Departemen maksimal 100 karakter")
    .transform(sanitizeText),
  position: z
    .string()
    .min(1, "Jabatan wajib diisi")
    .max(100, "Jabatan maksimal 100 karakter")
    .transform(sanitizeText),
  atkItemId: z.string().min(1, "Barang ATK wajib dipilih"),
  quantity: z
    .number()
    .int("Jumlah harus berupa angka bulat")
    .min(1, "Jumlah minimal 1"),
  reason: z
    .string()
    .max(500, "Alasan maksimal 500 karakter")
    .optional()
    .transform((v) => (v ? sanitizeText(v) : undefined)),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(["DIPROSES", "DITOLAK", "SELESAI"], {
    errorMap: () => ({ message: "Status tidak valid. Pilih: DIPROSES, DITOLAK, atau SELESAI" }),
  }),
  adminNote: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .nullable()
    .transform(sanitizeOptionalText),
  addToStock: z.boolean().optional(),
});

// ===========================================
// Helper: Format Zod errors
// ===========================================

export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => e.message).join(", ");
}
