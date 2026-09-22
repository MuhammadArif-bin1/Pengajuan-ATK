# 📋 Changelog & Laporan Pembaruan: Branch `overhaul` vs `main`

> **Tanggal Dokumen:** 22 September 2026  
> **Repository:** Pengajuan-ATK (Hasamitra Jabar)  
> **Perbandingan Branch:** `main` (Branch Dasar Hosting) ➔ `overhaul` (Branch Pengembangan Terbaru)  
> **Status Sinkronisasi:** Siap dimerge ke `main`

---

## 📊 1. Ringkasan Statistik Perubahan

| Parameter | Metrik | Keterangan |
|---|---|---|
| **Total File Berubah** | **52 File** | Mencakup schema, service, API route, pages, dan komponen UI |
| **Penambahan Baris (+)** | **+4.837 baris** | Komponen modular baru, halaman riwayat, cache control |
| **Pengurangan Baris (-)** | **-5.079 baris** | Pembersihan kode monolitik dan file usang (dead code) |
| **Divergensi Commit** | **8 Commit** | Terdepan di atas `main` tanpa konflik langsung |

---

## 🔍 2. Latar Belakang & Akar Masalah Perbedaan Local vs Deployment

Sebelumnya ditemukan gejala di mana data antrian dan notifikasi muncul di `localhost` (laptop lokal), namun di server deployment (laptop rekan/hosting) antrian terlihat kosong.

### Penyebab Utama:
1. **Branch Divergence**: Deployment server mengarah ke branch `main`, sedangkan pengembangan fitur antrian, notifikasi, dan perbaikan alur berjalan di branch `overhaul`.
2. **Perbedaan Status Database**:
   - Di branch `main`, kode program masih mengasumsikan status pengajuan bernilai `MENUNGGU` atau `DISETUJUI`.
   - Di branch `overhaul`, skema database telah dimigrasikan ke status baru (`DIPROSES` dan `SELESAI`).
   - Akibatnya, server hosting yang menjalankan kode branch `main` tidak menemukan data pengajuan yang sesuai dengan kriteria filter lama.
3. **Edge/CDN Caching**: Route API portal notifikasi pada branch `main` belum dilengkapi header `Cache-Control: no-store`, sehingga CDN edge hosting dapat meng-cache response kosong.

---

## 🗄️ 3. Perubahan Skema Database & Siklus Status

### 3.1. Penyederhanaan Status (`RequestStatus` Enum)
Pada [prisma/schema.prisma](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/prisma/schema.prisma), status pengajuan disederhanakan dari 5 status menjadi 3 status utama:

```prisma
// SEBELUMNYA (di branch main):
enum RequestStatus {
  MENUNGGU
  DISETUJUI
  DITOLAK
  DIPROSES
  SELESAI
}

// SEKARANG (di branch overhaul):
enum RequestStatus {
  DIPROSES
  DITOLAK
  SELESAI
}
```

### 3.2. Penyesuaian Alur Bisnis
- **Default Status Baru**: Pengajuan ATK karyawan langsung masuk dengan status **`DIPROSES`** (menggantikan `MENUNGGU`).
- **Penyelarasan Transaksi Stok**: Pengurangan stok pada gudang ATK disesuaikan secara atomik dengan status `DIPROSES` dan `SELESAI` di [src/services/request.service.ts](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/services/request.service.ts).

---

## 🚀 4. Fitur-Fitur Baru (New Features)

### 4.1. Halaman Riwayat Pengajuan Selesai
- **File Baru:** [src/app/user/riwayat/page.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/app/user/riwayat/page.tsx)
- **Fungsi:** 
  - Khusus menampilkan riwayat pengajuan ATK yang berstatus **`SELESAI`**.
  - Mengurangi beban kartu antrian di beranda. Pengajuan yang selesai pada hari berjalan tetap tampil di beranda hari itu, kemudian otomatis beralih hanya dapat diakses melalui halaman Riwayat pada keesokan harinya.
  - Dilengkapi fitur pencarian real-time, pagination, filter tanggal, dan modal detail pengajuan.

### 4.2. Halaman Pengajuan Pembelian ATK Baru
- **File Baru:** [src/app/user/pengajuan-pembelian/page.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/app/user/pengajuan-pembelian/page.tsx)
- **Fungsi:** Form khusus bagi divisi/karyawan untuk mengusulkan pengadaan barang inventaris baru yang belum terdaftar pada katalog stok ATK.

### 4.3. Integrasi Langsung Fast Track Telegram
- **File:** [src/components/dashboard/FastTrackModal.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/FastTrackModal.tsx) & [Sidebar.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/layout/Sidebar.tsx)
- **Fungsi:** Tombol aksi darurat/Fast Track langsung menghubungkan pengguna ke kontak Telegram penanggung jawab (`https://t.me/DennyXIX`) secara instan tanpa hambatan pengisian modal form.

---

## 🛠️ 5. Perbaikan Bug & Optimasi Performa (Fixes & Optimization)

### 5.1. Dashboard Admin Loop Auto-Refresh Fix
- **File:** [src/app/admin/dashboard/page.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/app/admin/dashboard/page.tsx)
- **Isu:** Halaman admin sering memicu re-fetch beruntun tanpa henti sehingga data gagal tampil / layar blank berkedip.
- **Solusi:** Isolasi state dependencies pada `useEffect`, stabilisasi memoized callbacks, dan penataan siklus polling.

### 5.2. Notification Polling & Null-Safety Guard
- **File:** [src/components/layout/NotificationDropdown.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/layout/NotificationDropdown.tsx)
- **Isu:** Muncul error browser `TypeError: Failed to fetch` akibat request polling notifikasi yang saling bertabrakan sebelum request sebelumnya selesai.
- **Solusi:** 
  - Penerapan `isFetchingRef` sebagai mutex guard agar tidak terjadi concurrent fetching.
  - Penambahan validasi aman (*null check*) untuk data relasi pengguna di endpoint API notifikasi.

### 5.3. Anti-Caching & Edge CDN Revalidation
- **File:** [src/app/api/requests/portal-notifications/route.ts](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/app/api/requests/portal-notifications/route.ts) & [src/app/page.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/app/page.tsx)
- **Solusi:** Pemasangan header `Cache-Control: no-store, no-cache, must-revalidate` dan opsi fetch `cache: 'no-store'` untuk memastikan server production Vercel menyajikan data antrian secara real-time.

### 5.4. Responsive Fluid Layout Saat Zoom In / Zoom Out
- **File:** [src/components/dashboard/QueueListCard.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/QueueListCard.tsx) & [StockCatalogCard.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/StockCatalogCard.tsx)
- **Solusi:** Mengganti ukuran border vertikal statis menjadi tinggi adaptif (`calc(100vh - ...)` dan fleksibel flex layout) sehingga proporsi tetap rapi pada level zoom berapapun.

### 5.5. Otorisasi Proxy/Middleware untuk Antrian Publik (Akar Masalah Sinkronisasi)
- **File:** [src/proxy.ts](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/proxy.ts)
- **Isu:** Antrian dan notifikasi muncul di `localhost` tetapi selalu kosong di hosting deployment (`https://pengajuan-atk.vercel.app/`).
- **Akar Masalah:** Di `proxy.ts`, rute `/api/requests/portal-notifications` dan `/user/riwayat` belum didaftarkan pada whitelist endpoint publik. Di `localhost`, browser pengguna telah memiliki cookie admin (`atk-session`) sehingga request diizinkan, sedangkan pada laptop rekan/pengguna biasa tanpa sesi admin, server deployment mengembalikan respon `HTTP 401 Unauthorized: Silakan login terlebih dahulu`.
- **Solusi:** Menambahkan `/api/requests/portal-notifications` (metode `GET`) ke daftar Public API Endpoints dan `/user/riwayat` ke Public Frontend Pages di `src/proxy.ts`.

---

## 🎨 6. Arsitektur Komponen & Restrukturisasi Kode

### 6.1. Modularisasi Beranda (`src/app/page.tsx`)
Sebelumnya file `page.tsx` berisi lebih dari 2.260 baris kode monolitik yang sulit dirawat. Kini dipecah menjadi komponen modular dan teruji:
- [DashboardHeader.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/DashboardHeader.tsx): Header sambutan, jam kerja, dan tombol aksi pengajuan.
- [QueueListCard.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/QueueListCard.tsx): Kartu antrian pengajuan harian yang interaktif.
- [StockCatalogCard.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/StockCatalogCard.tsx): Katalog stok ATK dengan filter kategori dan pencarian.
- [PengajuanAtkModal.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/PengajuanAtkModal.tsx): Modal formulir pengajuan barang.
- [StatusBadges.tsx](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/src/components/dashboard/StatusBadges.tsx): Komponen badge visual status terpadu.

### 6.2. Pembaharuan Branding & Logo
- Penambahan file logo resmi [public/Image/logo/Logo.webp](file:///d:/Project/Code/NextJs/Hasamitra/Alat%20Tulis%20Kantor/public/Image/logo/Logo.webp) dengan rasio aspek **6:1** pada Sidebar navigasi.

### 6.3. Pembersihan File Usang (Clean Code)
File-file lama yang tidak lagi digunakan telah dihapus dari repository:
- `src/app/user/dashboard/page.tsx`
- `src/app/user/pengajuan/page.tsx`
- `src/app/user/pengajuan/buat/page.tsx`
- `src/app/user/profile/page.tsx`
- `src/components/layout/UserLayout.tsx`

---

## 📜 7. Rincian Commit di Branch `overhaul`

Berikut adalah 8 commit berurutan yang membedakan branch `overhaul` dari `main`:

| No | Hash Commit | Pesan Commit & Rincian Singkat |
|:---:|:---:|---|
| 1 | `79d71dd` | `feat: overhaul architecture, modularize dashboard components, and fix atk request workflow` |
| 2 | `ecdd2d5` | `Update UI Admin` — Penyempurnaan dashboard, tabel barang, dan stok admin |
| 3 | `556dc16` | `Status Simplified` — Migrasi status `RequestStatus` menjadi `DIPROSES`, `DITOLAK`, `SELESAI` |
| 4 | `4c8116e` | `Update Riwayat Pengajuan, Manajemen Pembelian, & UI Logo Sidebar` — Penambahan modul riwayat dan logo 6:1 |
| 5 | `62bac09` | `fix(notifications): optimize polling interval and guard against concurrent fetch errors` |
| 6 | `c024472` | `fix(dashboard): make vertical height and card borders fluid and responsive on zoom in/out` |
| 7 | `b65b755` | `feat(fast-track): open Telegram account directly without form modal` |
| 8 | `370a640` | `fix(queue): disable production edge caching on portal-notifications and add safe relation handling` |

---

## 🚀 8. Langkah Rekomendasi Selanjutnya (Merge ke Main)

Untuk menyinkronkan server hosting production dengan fitur lokal, jalankan perintah git berikut:

```bash
# 1. Pastikan semua perubahan di branch overhaul tersimpan
git status

# 2. Pindah ke branch main
git checkout main

# 3. Gabungkan perubahan dari branch overhaul ke main
git merge overhaul

# 4. Push branch main ke repository remote
git push origin main
```

Setelah push selesai, platform hosting (Vercel / Cloud Provider) akan secara otomatis memicu proses *re-deployment* dengan seluruh perbaikan di atas.
