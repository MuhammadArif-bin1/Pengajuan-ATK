# 📋 Changelog: Perbaikan Sistem Pencarian & Penyeragaman Debounce (Fix Search)

> **Branch:** `Refactor`  
> **Tanggal:** 29 September 2026  
> **Tipe:** Bugfix & UX Optimization  
> **Catatan:** Dokumen ini berisi rincian perubahan untuk dicantumkan pada deskripsi Pull Request / Merge ke branch utama (`main`).

---

## 🔍 Ringkasan Masalah (Background)
1. **Pencarian Beranda Tidak Berfungsi:**
   - Pada halaman utama (`src/app/page.tsx`), nilai input pencarian di header portal tidak terhubung dengan state `debouncedSearch`, sehingga pengetikan kata kunci tidak memfilter kartu katalog stok ATK maupun kartu antrean pengajuan harian.
2. **Debounce Tidak Seragam & Beban Query Berlebih:**
   - Halaman riwayat pengajuan user menggunakan debounce 300 ms yang terlalu singkat.
   - Halaman-halaman panel admin (`/admin/pengajuan` dan `/admin/barang`) sebelumnya mengeksekusi request API database di setiap ketukan keyboard (*keystroke*), tanpa adanya debounce.
   - Halaman stok admin (`/admin/stok`) memfilter tabel langsung per karakter tanpa debounce.
3. **UX Tombol Reset & Clear:**
   - Tombol clear `✕` belum tersedia secara seragam di tampilan pencarian mobile header.

---

## 🛠️ Rincian Perubahan (Changes Implemented)

### 1. Beranda / Portal Karyawan (`src/app/page.tsx`)
- Menambahkan `useEffect` sinkronisasi debounce dengan jeda **1000 ms (1 detik)** antara `searchInput` dan `debouncedSearch`.
- Menyambungkan state `isDebouncing` untuk indikator visual saat pengguna sedang mengetik.
- Tombol clear pencarian langsung mengosongkan state seketika tanpa menunggu debounce.
- Membersihkan banner notifikasi filter pencarian di bawah header sesuai preferensi UI yang lebih rapi.

### 2. Header Portal (`src/components/layout/PortalHeader.tsx`)
- Menambahkan tombol clear `✕` pada input pencarian mode mobile agar konsisten dengan mode desktop.
- Indikator animasi ping/loading tetap muncul selama jeda debounce 1000 ms berlangsung.

### 3. Riwayat Pengajuan User (`src/app/user/riwayat/page.tsx`)
- Mengubah durasi debounce pencarian dari 300 ms menjadi **1000 ms**.
- Halaman otomatis kembali ke `page 1` setelah query pencarian selesai di-debounce.

### 4. Admin Permohonan ATK Reguler (`src/app/admin/pengajuan/page.tsx`)
- Mengintegrasikan state `debouncedSearch` dengan jeda debounce **1000 ms**.
- Request API `/api/requests?search=...` kini hanya dikirimkan 1 detik setelah user berhenti mengetik, menghemat beban database.
- Fungsi reset filter langsung mengosongkan nilai pencarian seketika.

### 5. Admin Pengajuan Pembelian Barang Baru (`src/app/admin/barang/page.tsx`)
- Menambahkan state `debouncedSearch` dan jeda debounce **1000 ms**.
- Mengurangi request jaringan berulang saat admin mencari data permohonan pengadaan barang.
- Fungsi reset filter langsung mengosongkan query debounce.

### 6. Admin Manajemen Stok ATK (`src/app/admin/stok/page.tsx`)
- Menambahkan debounce **1000 ms** pada state pencarian lokal nama alat tulis dan deskripsi barang.
- Filter ketersediaan stok berjalan lebih mulus tanpa stuttering tabel saat pengetikan cepat.

---

## 📁 File yang Berubah (Modified Files)
- `src/app/page.tsx`
- `src/components/layout/PortalHeader.tsx`
- `src/app/user/riwayat/page.tsx`
- `src/app/admin/pengajuan/page.tsx`
- `src/app/admin/barang/page.tsx`
- `src/app/admin/stok/page.tsx`
- `doc/changelog.md` *(Changelog sementara baru untuk catatan Pull Request)*
- Penghapusan changelog arsip lama (`doc/changelog-refactor.md`, `doc/changelog-system-improvements.md`)

---

## 🧪 Validasi & Pengujian
- **Type Checking:** `npx tsc --noEmit` lolos 100% tanpa error.
- **Debounce Test:** Pengujian pencarian di Beranda, Riwayat, dan Panel Admin menunjukkan jeda eksekusi tepat 1000 ms setelah pengetikan selesai.
- **Clear Button Test:** Tombol `✕` dan reset langsung membersihkan filter pencarian tanpa penundaan.
