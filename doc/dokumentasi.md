# Buku Panduan & Dokumentasi Sistem Informasi Pengajuan ATK
## PT Hasamitra Bersama — Versi 2.0.0

---

## 📌 Daftar Isi
1. [Ikhtisar Aplikasi](#1-ikhtisar-aplikasi)
2. [Panduan Pengguna: Portal Karyawan](#2-panduan-pengguna-portal-karyawan)
   - 2.1 [Formulir Permintaan ATK Gudang](#21-formulir-permintaan-atk-gudang)
   - 2.2 [Formulir Pengajuan Pembelian ATK Baru](#22-formulir-pengajuan-pembelian-atk-baru)
   - 2.3 [Layanan Bantuan Fast-Track Telegram CS](#23-layanan-bantuan-fast-track-telegram-cs)
3. [Panduan Pengguna: Portal Administrator](#3-panduan-pengguna-portal-administrator)
   - 3.1 [Autentikasi, Captcha & Fitur Lihat Sandi](#31-autentikasi-captcha--fitur-lihat-sandi)
   - 3.2 [Dashboard Statistik & Pemantauan](#32-dashboard-statistik--pemantauan)
   - 3.3 [Pengelolaan Pengajuan ATK Gudang](#33-pengelolaan-pengajuan-atk-gudang)
   - 3.4 [Pengelolaan Pengajuan Pembelian ATK Baru](#34-pengelolaan-pengajuan-pembelian-atk-baru)
   - 3.5 [Sistem Notifikasi Realtime & Alarm Audio](#35-sistem-notifikasi-realtime--alarm-audio)
   - 3.6 [Laporan, Analisis & Ekspor CSV](#36-laporan-analisis--ekspor-csv)
4. [Panduan Teknis & Arsitektur Pengembang](#4-panduan-teknis--arsitektur-pengembang)
   - 4.1 [Spesifikasi Teknologi](#41-spesifikasi-teknologi)
   - 4.2 [Struktur Direktori Proyek](#42-struktur-direktori-proyek)
   - 4.3 [Konfigurasi Lingkungan (`.env`)](#43-konfigurasi-lingkungan-env)
   - 4.4 [Daftar Endpoint API](#44-daftar-endpoint-api)
5. [Instalasi, Menjalankan Sistem & Deployment](#5-instalasi-menjalankan-sistem--deployment)
   - 5.1 [Langkah Menjalankan di Lokal](#51-langkah-menjalankan-di-lokal)
   - 5.2 [Deploy ke Vercel](#52-deploy-ke-vercel)
6. [Tanya Jawab & Pemecahan Masalah (Troubleshooting)](#6-tanya-jawab--pemecahan-masalah-troubleshooting)

---

## 1. Ikhtisar Aplikasi

**Sistem Informasi Pengajuan ATK (Alat Tulis Kantor)** adalah aplikasi berbasis web yang dirancang khusus untuk memfasilitasi proses permohonan inventaris dan pengadaan barang ATK di lingkungan **PT Hasamitra Bersama**.

Aplikasi terbagi menjadi 2 area utama:
1. **Portal Karyawan (Publik - `/`)**: Dapat diakses langsung oleh seluruh karyawan tanpa login rumit untuk mengajukan permintaan barang gudang maupun pengadaan pembelian barang baru.
2. **Portal Admin (Terproteksi - `/admin/*`)**: Area khusus administrator logistik / General Affair untuk memverifikasi, menyetujui/menolak berkas, memantau pengajuan secara realtime, serta mengunduh laporan rekapitulasi data.

---

## 2. Panduan Pengguna: Portal Karyawan

Portal Karyawan dapat diakses melalui alamat utama website (`https://pengajuan-atk.vercel.app/` atau `http://localhost:3000/`).

### 2.1 Formulir Permintaan ATK Gudang
Menu ini digunakan ketika karyawan membutuhkan alat tulis kantor yang **sudah lazim tersedia di stok gudang kantor** (seperti pulpen, kertas HVS, map, spidol, gunting, dll).

**Langkah-langkah Pengajuan:**
1. Pada sidebar menu kiri, pilih tab **"Form Pengajuan"**.
2. Masukkan identitas pemohon:
   - **Nama Lengkap**: Nama karyawan pemohon.
   - **Departemen / Divisi**: Divisi kerja (contoh: `Marketing`, `IT`, `Operasional`, `Keuangan`).
   - **Jabatan**: Posisi kerja (contoh: `Supervisor`, `Staff`, `Manajer`).
3. Masukkan detail barang yang diajukan:
   - **Nama Barang ATK**: Nama barang yang diinginkan (contoh: *Pulpen Snowman Hitam*).
   - **Jumlah yang Dibutuhkan**: Masukkan angka kuantitas barang yang dibutuhkan (hanya menerima input digit angka).
   - **Alasan & Keperluan Penggunaan (Opsional)**: Tuliskan urgensi atau peruntukan penggunaan barang.
4. Klik tombol **"Kirim Pengajuan ATK"**.
5. Banner hijau konfirmasi sukses akan muncul, menandakan berkas telah tersimpan dan masuk ke antrean persetujuan admin.

---

### 2.2 Formulir Pengajuan Pembelian ATK Baru
Menu ini digunakan apabila barang yang dibutuhkan **belum ada di gudang** dan memerlukan pengadaan/pembelian baru oleh kantor.

**Langkah-langkah Pengajuan:**
1. Pada sidebar menu kiri, pilih tab **"Pengajuan Pembelian ATK"**.
2. Lengkapi data pemohon (Nama, Departemen, dan Jabatan).
3. Masukkan nama barang ATK baru yang ingin dibeli serta jumlah kuantitas angka yang dibutuhkan.
4. Tuliskan alasan/urgensi pembelian barang tersebut pada kolom catatan.
5. Klik tombol **"Kirim Pengajuan Pembelian ATK"**.
6. Sistem akan otomatis melabeli berkas ini dan menyalurkannya langsung ke modul *Pengajuan Pembelian Admin*.

---

### 2.3 Layanan Bantuan Fast-Track Telegram CS
Apabila karyawan memiliki pengajuan darurat (*urgent*) atau membutuhkan bantuan segera:
- Di pojok kanan bawah layar terdapat tombol bulat mengambang berlogo **Telegram** dengan bubble bertuliskan **"fast track? Hubungi Admin"**.
- Mengklik teks bubble atau ikon Telegram akan langsung membuka chat ke akun Telegram Admin Logistik (`t.me/DennyXIX`).

---

## 3. Panduan Pengguna: Portal Administrator

### 3.1 Autentikasi, Captcha & Fitur Lihat Sandi
Halaman login admin dapat diakses melalui link **"Portal Admin"** di navbar atas atau URL `/admin/login`.

**Prosedur Masuk:**
1. Masukkan **Email Administrator** terdaftar.
2. Masukkan **Kata Sandi**:
   - Anda dapat mengklik **Ikon Mata** di sebelah kanan kolom sandi untuk melihat/memeriksa kembali ketikan kata sandi (*Show Password*).
   - Klik kembali untuk menyembunyikan kata sandi.
3. Jawab perhitungan **Captcha Matematika** (contoh: `4 x 6 = ?` ➔ isi `24`).
   - Klik tombol *Ganti Soal* jika ingin mengubah soal matematika.
4. Klik tombol **"Masuk ke Halaman Admin"**.

---

### 3.2 Dashboard Statistik & Pemantauan
Setelah login, admin disambut oleh Dashboard Utama (`/admin/dashboard`):
- **Kartu Metrik Utama**:
  - *Total Pengajuan ATK (Permintaan Gudang)*: Menampilkan total berkas barang reguler (dapat diklik untuk menuju `/admin/pengajuan`).
  - *Total Pengajuan Pembelian ATK*: Menampilkan total berkas pengadaan baru (dapat diklik untuk menuju `/admin/barang`).
  - *Menunggu Persetujuan*: Jumlah permohonan yang butuh tindakan segera.
  - *Disetujui* & *Ditolak*: Riwayat keputusan admin.
- **Tabel Transaksi Terbaru**: Menampilkan 5 pengajuan terkini yang masuk ke sistem.

---

### 3.3 Pengelolaan Pengajuan ATK Gudang (`/admin/pengajuan`)
Halaman ini menampilkan seluruh permohonan barang reguler gudang:
1. **Pencarian & Filter**: Admin dapat mencari berdasarkan nama pemohon, barang, departemen, atau memfilter status (*MENUNGGU*, *DISETUJUI*, *DIPROSES*, *SELESAI*, *DITOLAK*).
2. **Aksi Persetujuan / Penolakan**:
   - Klik tombol **Aksi / Detail** pada baris pengajuan.
   - Ubah status menjadi *DISETUJUI* (stok inventaris otomatis berkurang secara atomik) atau *DITOLAK*.
   - Sematkan **Catatan Admin** (misalnya: *"Barang dapat diambil di gudang lantai 2"*).
   - Klik **Simpan Perubahan**.
3. **Hapus Data**: Admin dapat menghapus berkas permohonan jika diperlukan.

---

### 3.4 Pengelolaan Pengajuan Pembelian ATK Baru (`/admin/barang`)
Halaman ini terisolasi khusus untuk menampung permohonan pembelian barang baru dari karyawan:
- Menyajikan data pemohon, nama barang baru, jumlah unit, dan estimasi/alasan pembelian.
- Admin dapat meninjau anggaran dan mengubah status menjadi *Disetujui*, *Sedang Diproses Pengadaan*, *Selesai Dibeli*, atau *Ditolak*.

---

### 3.5 Sistem Notifikasi Realtime & Alarm Audio
Sistem dilengkapi dengan modul pemantau realtime di navbar atas:
1. **Badge Counter**: Ikon lonceng berkedip dengan indikator angka merah saat ada pengajuan baru yang belum ditinjau.
2. **Audio Chime Alarm**: Sintesis nada lonceng (*Web Audio API*) akan berbunyi otomatis saat ada pengiriman berkas baru oleh karyawan.
3. **Toast Alert Banner**: Muncul pop-up hijau di pojok kanan atas dengan ringkasan nama karyawan dan barang yang diajukan.
4. **Dropdown Notifikasi**: Memungkinkan admin memfilter pemberitahuan berdasarkan kategori (*Semua*, *Permintaan ATK*, *Pembelian ATK*).

---

### 3.6 Laporan, Analisis & Ekspor CSV (`/admin/laporan`)
Modul ini digunakan untuk evaluasi penggunaan ATK dan pembuatan laporan berkala:
1. **Parameter Filter Laporan**:
   - *Kategori Pengajuan*: Semua Kategori / Permintaan Gudang Saja / Pembelian Baru Saja.
   - *Departemen / Divisi*: Pilih departemen tertentu atau Semua Departemen.
   - *Rentang Tanggal*: Pilih Tanggal Mulai dan Tanggal Akhir.
2. **Rekapitulasi Data**:
   - Tabel Rekap per Departemen (Total, Disetujui, Ditolak).
   - Tabel Top Barang ATK Paling Sering Diajukan (Frekuensi & Kuantitas).
   - Tabel Lengkap Seluruh Transaksi Pengajuan.
3. **Fitur Ekspor CSV (.csv)**:
   - Klik tombol hijau **"Ekspor ke CSV (.csv)"**.
   - Menghasilkan file spreadsheet resmi: `Laporan_ATK_Hasamitra_YYYYMMDD_HHMM.csv`.
   - Menggunakan format **UTF-8 BOM** berstandar RFC-4180 sehingga kolom dan tulisan langsung tertata rapi saat dibuka di Microsoft Excel.
4. **Fitur Cetak Hardcopy**:
   - Klik tombol **"Cetak"** untuk mencetak dokumen langsung ke printer atau menyimpan sebagai file PDF.

---

## 4. Panduan Teknis & Arsitektur Pengembang

### 4.1 Spesifikasi Teknologi
| Komponen | Teknologi yang Digunakan |
| :--- | :--- |
| **Framework Web** | Next.js 16 (App Router, Turbopack) |
| **Bahasa Pemrograman** | TypeScript 5 |
| **ORM / Data Access** | Prisma ORM v7 (`@prisma/client`, `@prisma/adapter-pg`) |
| **Basis Data** | PostgreSQL (Neon Serverless Database) |
| **Styling & UI** | Tailwind CSS v4 (Modern HSL Color Tokens, Responsive Layout) |
| **Keamanan & Auth** | `jose` (JWT Cookie), `bcryptjs` (Password Hash), Dynamic Math Captcha |
| **Audio Synthesizer** | Web Audio API (Native Browser Synthesis) |

---

### 4.2 Struktur Direktori Proyek
```text
web-atk/
├── doc/                        # Dokumentasi Sistem
│   ├── arsitektur.md           # Arsitektur & Diagram Database
│   ├── audit.md                # Laporan Audit Keamanan
│   ├── dokumentasi.md          # Buku Panduan Lengkap (File Ini)
│   └── prd.md                  # Product Requirement Document (PRD)
├── prisma/
│   ├── schema.prisma           # Skema Model Database
│   └── seed.ts                 # Database Seeder (Admin & Default Data)
├── public/                     # Aset Publik (Gambar, Logo, Ikon)
│   └── Image/                  # Logo Bulat & Background Hasamitra
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── barang/         # Pengajuan Pembelian ATK
│   │   │   ├── dashboard/      # Dashboard Utama Admin
│   │   │   ├── laporan/        # Laporan & Ekspor CSV
│   │   │   ├── login/          # Login Admin, Captcha, Show Password
│   │   │   └── pengajuan/      # Pengajuan Permintaan ATK Gudang
│   │   ├── api/
│   │   │   ├── admin/          # API Notifikasi Realtime
│   │   │   ├── atk/            # API Inventaris Barang
│   │   │   ├── auth/           # API Login, Logout, Captcha
│   │   │   ├── requests/       # API CRUD Pengajuan, Status, Report
│   │   │   └── users/          # API Pengguna & Departemen
│   │   ├── globals.css         # Global Styles Tailwind
│   │   ├── layout.tsx          # Root HTML Layout
│   │   └── page.tsx            # Portal Karyawan Publik (Tab 1 & 2)
│   ├── components/
│   │   ├── layout/             # AdminLayout, Navbar, Sidebar, NotificationDropdown
│   │   └── ui/                 # Badge, Button, Card, Modal, Table, Toast, dll.
│   ├── lib/
│   │   ├── auth.ts             # JWT Sign & Verify, Cookie Helper
│   │   ├── exportExcel.ts      # Engine Ekspor CSV UTF-8 BOM
│   │   ├── notificationSound.ts# Synthesizer Audio Lonceng Realtime
│   │   ├── prisma.ts           # Singleton Prisma Client & PG Connection Pool
│   │   └── validation.ts       # Skema Validasi Zod
│   ├── services/
│   │   ├── atk.service.ts      # Logika Bisnis Inventaris Barang
│   │   ├── request.service.ts  # Logika Bisnis Pengajuan & Approval
│   │   └── user.service.ts     # Logika Bisnis User & Autentikasi
│   └── types/                  # Deklarasi Type TypeScript
├── .env                        # Konfigurasi Environment Variable
├── next.config.ts              # Konfigurasi Next.js
├── package.json                # Dependensi Proyek
└── tsconfig.json               # Konfigurasi TypeScript
```

---

### 4.3 Konfigurasi Lingkungan (`.env`)
Contoh variabel lingkungan yang dibutuhkan sistem:
```env
# URL Koneksi PostgreSQL (Contoh: Neon Serverless)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require"

# Secret Key untuk Tanda Tangan Token JWT
JWT_SECRET="hasamitra_super_secure_jwt_secret_key_2026"

# Konfigurasi Node Environment
NODE_ENV="production"
```

---

### 4.4 Daftar Endpoint API Utama

| Metode | Rute Endpoint | Deskripsi Fungsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login admin dengan validasi email, password, dan token captcha matematika |
| `GET` | `/api/auth/captcha` | Mengenerate soal matematika acak dan token enkripsi sementara |
| `POST` | `/api/auth/logout` | Menghapus cookie sesi autentikasi admin |
| `POST` | `/api/requests` | Mengirim permohonan permintaan ATK dari portal karyawan |
| `POST` | `/api/requests/purchase` | Mengirim permohonan pembelian barang ATK baru |
| `GET` | `/api/requests` | Mengambil daftar seluruh pengajuan dengan filter tipe dan status |
| `PATCH`| `/api/requests/:id/status` | Mengubah status pengajuan (*DISETUJUI*, *DITOLAK*, *DIPROSES*, *SELESAI*) |
| `DELETE`| `/api/requests/:id` | Menghapus data permohonan dari sistem |
| `GET` | `/api/requests/report` | Mengambil data agregasi rekapitulasi untuk halaman laporan |
| `GET` | `/api/admin/notifications` | Endpoint polling realtime untuk mengambil 20 aktivitas terbaru |

---

## 5. Instalasi, Menjalankan Sistem & Deployment

### 5.1 Langkah Menjalankan di Lokal (Development)

1. **Clone Repository & Masuk ke Folder Proyek**:
   ```bash
   git clone https://github.com/MuhammadArif-bin1/Pengajuan-ATK.git
   cd Pengajuan-ATK/web-atk
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Sinkronisasi Database Prisma**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka browser pada alamat `http://localhost:3000`.

---

### 5.2 Deploy ke Vercel (Production)

Proyek ini telah terkonfigurasi dengan baik untuk deployment otomatis di Vercel:
1. Hubungkan repository GitHub ke proyek Vercel.
2. Atur **Environment Variables** di Vercel Dashboard:
   - `DATABASE_URL`: Masukkan URL database PostgreSQL aktif (misal Neon DB).
   - `JWT_SECRET`: Masukkan string acak yang aman.
3. Build Command: `npm run build` (secara otomatis menjalankan `npx prisma generate && next build`).
4. Output Directory: `.next`.
5. Klik **Deploy**.

---

## 6. Tanya Jawab & Pemecahan Masalah (Troubleshooting)

### Q1: Mengapa saat membuka file `.csv` di Microsoft Excel beberapa huruf terlihat aneh?
**Jawab**: Sistem ini telah mengimplementasikan **UTF-8 BOM (`\uFEFF`)** secara otomatis saat mengunduh CSV. Pastikan Anda membuka file CSV yang diunduh langsung dari tombol *"Ekspor ke CSV"* pada modul Laporan versi terbaru.

### Q2: Mengapa kolom jumlah tidak bisa diisi huruf?
**Jawab**: Kolom *"Jumlah yang Dibutuhkan"* telah divalidasi secara ketat (*numeric-only*) untuk menjamin integritas kuantitas data agar tidak terjadi kesalahan hitung pada inventaris gudang dan laporan rekapitulasi.

### Q3: Bagaimana jika ada admin yang lupa kata sandi?
**Jawab**: Administrator utama dapat mengatur ulang kata sandi melalui database seeder (`npm run db:seed`) atau memperbarui kolom password hash melalui script helper `bcryptjs`.

---

*Dokumentasi ini disusun sebagai panduan operasional resmi untuk Karyawan, Administrator, dan Tim Pengembang PT Hasamitra Bersama.*
