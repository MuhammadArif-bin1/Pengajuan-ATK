# 📋 Changelog: Refactoring & Optimasi Sistem (Branch `Refactor`)

> **Tanggal Rilis:** 23 September 2026  
> **Repository:** Pengajuan-ATK (Hasamitra Jabar)  
> **Branch:** `Refactor` (dibuat dari branch `overhaul`)  
> **Tujuan:** Restrukturisasi arsitektur kode (Clean Architecture, DRY), modularisasi komponen besar, dan optimasi runtime/network tanpa mengubah alur bisnis atau skema database.

---

## 🎯 Ringkasan Eksekutif

Proses refactoring dilakukan secara terstruktur melalui **4 Fase Terisolasi** dengan prinsip zero-regression:
1. **100% Menjaga Logika & Skema Bisnis**: Alur status tetap `DIPROSES` ➔ `SELESAI` / `DITOLAK`. Skema database Prisma Neon tidak diubah.
2. **Eliminasi Redudansi (DRY)**: Menggabungkan puluhan duplikasi logika user, navbar, notifikasi audio, dan polling antarhalaman.
3. **Peningkatan Performa Runtime**: Menghentikan pemborosan resource network via *Smart Polling* (Page Visibility API) dan memangkas ukuran initial bundle via *Dynamic Lazy Import* library `xlsx`.
4. **Verifikasi Penuh**: 
   - `npx tsc --noEmit` ➔ **0 Error** (100% Type-Safe)
   - `npm run build` ➔ **Exit Code 0** (25 routes compiled successfully via Turbopack)

---

## 📦 Rincian Perubahan per Fase

### 🔹 Fase 1: Singleton Database & Service Layer (Backend Core)
* **`src/lib/prisma.ts`**:
  - Mengunci caching singleton untuk `pg.Pool` dan `PrismaClient` di scope `globalThis`.
  - Mencegah kebocoran koneksi (*connection pool leakage*) dan latensi tinggi pada lingkungan serverless Vercel.
* **`src/services/user.service.ts`**:
  - Menambahkan fungsi terpusat `getOrCreateEmployeeUser(name, department, position, email?)`.
* **`src/services/request.service.ts`**:
  - Mengarahkan pembuatan pemohon ATK pada fungsi terpusat `getOrCreateEmployeeUser`.
* **`src/app/api/requests/purchase/route.ts`**:
  - Mengeliminasi lebih dari 60 baris duplikasi logika pencarian/pembuatan user, fallback email, dan hashing password.
  - Membersihkan modul `bcryptjs` yang tidak terpakai pada route ini.

---

### 🔹 Fase 2: Reusable Portal Navigation & Shared Notification Hook (Frontend Core)
* **`src/hooks/usePortalNotifications.ts`** `[NEW]`:
  - Custom React hook terpusat untuk mengelola state notifikasi pengguna publik, sinkronisasi status dibaca di `localStorage`, audio chime alarm, dan polling otomatis.
* **`src/components/layout/PortalHeader.tsx`** `[NEW]`:
  - Komponen header universal untuk portal pengguna publik.
  - Mendukung: bilah pencarian debounced (opsional), tombol sakelar suara alert, lonceng notifikasi real-time dengan dropdown interaktif, dan tombol hamburger menu responsif mobile.
* **`src/components/dashboard/DashboardHeader.tsx`**:
  - Disederhanakan dari 223 baris menjadi 45 baris dengan mendelegasikan navigasi ke `PortalHeader`.
* **`src/app/user/riwayat/page.tsx` & `src/app/user/pengajuan-pembelian/page.tsx`**:
  - Menghapus ~280 baris kode copy-paste navbar dan menyatukan pengalaman pengguna antarmuka portal.

---

### 🔹 Fase 3: Modularisasi Halaman Besar (Riwayat Pengajuan Selesai)
Berkas monolitik `src/app/user/riwayat/page.tsx` yang sebelumnya berisi **726 baris** berhasil didekomposisi menjadi subkomponen berfokus tunggal (*single responsibility*), menyusut menjadi **273 baris**:
* **`src/components/riwayat/historyHelpers.ts`** `[NEW]`:
  - Fungsi murni pembantu: `formatDate` (ID locale), `formatDateTime`, dan `cleanReason` (pembersihan prefix tag alasan).
* **`src/components/riwayat/HistoryStatsCards.tsx`** `[NEW]`:
  - Menampilkan 3 kartu metrik ringkasan: *Total Riwayat*, *Selesai Hari Ini*, dan *Total Item Diserahkan*.
* **`src/components/riwayat/HistoryFilterBar.tsx`** `[NEW]`:
  - Komponen bilah filter: input teks pencarian, dropdown divisi, dropdown preset periode waktu, pemilih rentang tanggal, urutan sorting waktu, dan tombol *Reset Filter*.
* **`src/components/riwayat/HistoryTable.tsx`** `[NEW]`:
  - Tabel riwayat pengajuan selesai, tombol cetak (*print preview*), penanganan state kosong (*empty state*), tombol aksi modal detail, dan kontrol paginasi.
* **`src/components/riwayat/HistoryDetailModal.tsx`** `[NEW]`:
  - Modal pop-up rincian lengkap berkas pengajuan saat tombol *Detail* ditekan.

---

### 🔹 Fase 4: Optimasi Performa, Network Smart Polling & Dynamic Lazy Import
* **Smart Polling dengan Page Visibility API**:
  - Mengintegrasikan pengecekan `document.visibilityState === "visible"` serta event listener ganda `visibilitychange` dan `window.focus`.
  - **Dampak**: Jika tab diminimize atau pengguna membuka tab lain, siklus polling otomatis dijeda (*paused*). Saat tab dibuka kembali, data langsung diperbarui seketika.
  - Diterapkan secara seragam pada seluruh modul:
    - `src/hooks/usePortalNotifications.ts`
    - `src/app/page.tsx`
    - `src/components/layout/NotificationDropdown.tsx`
    - `src/app/admin/stok/page.tsx`
    - `src/app/admin/pengajuan/page.tsx`
    - `src/app/admin/barang/page.tsx`
    - `src/app/admin/laporan/page.tsx`
    - `src/app/admin/dashboard/page.tsx`
* **Dynamic Lazy Import Modul `xlsx` & Ekspor Multi-Sheet Excel**:
  - `src/lib/exportExcel.ts`: Menambahkan fungsi `exportReportToExcel` menggunakan dynamic asynchronous import (`await import("xlsx")`). Library `xlsx` (~1MB) tidak lagi membebani initial JavaScript bundle browser, melainkan hanya diunduh saat tombol ekspor ditekan.
  - Menghasilkan berkas Excel biner `.xlsx` dengan 3 worksheet otomatis (*Daftar Transaksi*, *Rekap Departemen*, *Rekap Barang ATK*).
  - `src/app/admin/laporan/page.tsx`: Menyediakan tombol **Ekspor Excel** dan **Ekspor CSV** secara berdampingan.

---

## 📑 5. Pembaruan Dokumentasi Teknis
* **`doc/arsitektur.md`**: Diperbarui menjadi panduan arsitektur modern yang ringkas, menyajikan alur Request-Response, struktur direktori terbaru, dan daftar file konfigurasi utama.
* **`doc/dokumentasi.md`**: Dirapikan menjadi panduan operasional sistem yang mudah dibaca oleh tim teknis dan non-teknis.

---

## 🧪 6. Hasil Pengujian & Verifikasi

| Komponen Uji | Metode Pengujian | Hasil |
|---|---|---|
| **Kompilasi TypeScript** | `npx tsc --noEmit` | **0 Error (Lolos)** |
| **Next.js Production Build** | `npm run build` | **Sukses (25 Routes, Turbopack)** |
| **Prisma ORM Generation** | `npx prisma generate` | **Sukses (Client 7.9.1)** |
| **Pengujian Fungsional Web** | Manual Testing di Browser (`localhost:3000`) | **Semua fitur berfungsi normal tanpa kendala** |
