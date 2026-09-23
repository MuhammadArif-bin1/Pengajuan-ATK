# 📖 Panduan Pengguna & Operasional Sistem Pengajuan ATK
> **PT Hasamitra Jabar** — Sistem Manajemen Inventaris & Pengajuan ATK Real-Time

Dokumen ini adalah panduan praktis penggunaan aplikasi, baik untuk **Karyawan** (portal publik) maupun **Administrator** (manajemen pengajuan & logistik).

---

## 🌟 1. Sekilas Sistem

Aplikasi terbagi menjadi dua area utama:
1. **Portal Karyawan (Publik - Tanpa Login)**: Untuk mengecek stok barang, memantau antrian, mengajukan ATK, melihat riwayat selesai, dan mengusulkan pembelian baru.
2. **Panel Admin (Terproteksi - `/admin`)**: Khusus petugas logistik/GA untuk menyetujui/menolak pengajuan, mengelola stok gudang, dan mengunduh laporan rekapitulasi.

---

## 👤 2. Panduan Karyawan (Portal Publik)

Karyawan dapat langsung mengakses portal melalui browser tanpa perlu membuat akun:

### 2.1. Cek Stok & Ajukan ATK Reguler (Halaman Beranda `/`)
* **Katalog Stok**: Di sisi kiri beranda, Anda dapat melihat ketersediaan barang ATK secara real-time (*Tersedia*, *Menipis*, atau *Kosong*).
* **Cara Mengajukan**:
  1. Klik tombol bulat **(+)** di pojok kanan bawah.
  2. Pilih barang dari katalog, isi nama pemohon, divisi, jabatan, jumlah yang dibutuhkan, dan alasan.
  3. Klik **"Kirim Pengajuan ATK"**.
* **Pantau Antrian**: Di sisi kanan beranda, status pengajuan Anda langsung tampil dengan badge status:
  - 🟡 **DIPROSES**: Berkas baru masuk dan sedang disiapkan admin.
  - 🟢 **SELESAI**: Barang sudah siap/dapat diambil (tampil di beranda pada hari tersebut).
  - 🔴 **DITOLAK**: Pengajuan ditolak (klik untuk melihat catatan alasan admin).

### 2.2. Halaman Riwayat Pengajuan Selesai (`/user/riwayat`)
* Seluruh berkas yang telah berstatus **SELESAI** pada hari-hari sebelumnya otomatis diarsipkan di halaman ini.
* Dilengkapi kolom pencarian instan dan filter tanggal untuk mempermudah pengecekan riwayat pengambilan barang divisi Anda.

### 2.3. Pengajuan Pembelian ATK Baru (`/user/pengajuan-pembelian`)
* Gunakan menu ini jika barang ATK yang Anda butuhkan **belum ada di katalog gudang**.
* Isi formulir usulan barang baru beserta estimasi jumlah dan alasan urgensi pengadaan.

### 2.4. Bantuan Cepat (Fast Track Telegram)
* Untuk kebutuhan darurat (*urgent*), klik tombol **Fast Track Telegram** di sidebar atau tombol bantuan untuk langsung terhubung ke chat Telegram penanggung jawab logistik (`https://t.me/DennyXIX`).

---

## 🛡️ 3. Panduan Administrator (`/admin`)

### 3.1. Login & Keamanan
1. Akses halaman `/admin/login`.
2. Masukkan **Email** dan **Kata Sandi** (klik ikon mata untuk mengecek ketikan sandi).
3. Jawab pertanyaan **Captcha Matematika** (contoh: `3 + 5 = 8`).
4. Klik **"Masuk ke Halaman Admin"**.

### 3.2. Memproses Pengajuan Karyawan (`/admin/pengajuan`)
Admin meninjau permohonan masuk dan mengubah statusnya:
* 🟢 **Ubah ke SELESAI**: Klik tombol selesai saat barang diserahkan ke karyawan. **Stok fisik barang di sistem otomatis terpotong**.
* 🔴 **Ubah ke DITOLAK**: Masukkan catatan alasan penolakan (misal: *Stok habis*, *Alasan kurang jelas*). Catatan ini dapat dibaca oleh karyawan di portal depan.

### 3.3. Manajemen Barang & Stok Fisik (`/admin/barang` & `/admin/stok`)
* **Tambah Barang**: Masukkan nama barang, deskripsi, kuantitas stok awal, dan satuan (*pcs, box, rim, dll*).
* **Penyesuaian Stok**: Lakukan *stock opname* atau koreksi kuantitas barang fisik gudang kapan saja.

### 3.4. Notifikasi Real-Time & Laporan (`/admin/laporan`)
* **Alarm Audio & Lonceng**: Setiap ada permohonan baru dari karyawan, lonceng notifikasi akan berkedip disertai nada dering alarm.
* **Ekspor Laporan**: Filter data berdasarkan departemen dan rentang tanggal, lalu klik **"Ekspor ke Excel"** untuk mengunduh rekapitulasi data format `.xlsx`.

---

## ⚙️ 4. Konfigurasi Lingkungan (`.env`)

File konfigurasi runtime terletak pada root proyek:

```env
# Koneksi Basis Data Neon PostgreSQL
DATABASE_URL="postgresql://user:pass@ep-pooler.region.neon.tech/neondb?sslmode=verify-full"

# Kunci Enkripsi Sesi JWT Admin
AUTH_SECRET="kunci_rahasia_enkripsi_jwt_session"

# Kredensial Default Seed Admin
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="Admin123!"

NODE_ENV="production"
```

---

## 🚀 5. Cara Menjalankan Aplikasi

```bash
# 1. Install dependensi proyek
npm install

# 2. Sinkronisasi skema basis data
npx prisma generate
npx prisma db push

# 3. Jalankan server lokal
npm run dev
# Akses portal di: http://localhost:3000
# Akses panel admin di: http://localhost:3000/admin
```

---

## ❓ 6. Pertanyaan Umum (FAQ)

| Pertanyaan | Penjelasan |
|---|---|
| **Kenapa antrian yang kemarin sudah selesai tidak ada di beranda?** | Pengajuan berstatus *SELESAI* hanya tampil di antrian beranda pada hari berjalan agar beranda tidak penuh. Berkas lama tetap tersimpan rapi di menu **Riwayat Pengajuan**. |
| **Kapan stok barang gudang berkurang?** | Stok barang otomatis berkurang secara atomik saat admin mengubah status permohonan menjadi **SELESAI**. |
| **Bagaimana jika lupa sandi admin?** | Hubungi teknisi pengembang untuk menjalankan seed ulang kredensial via script terminal (`npm run db:seed`). |
