# Sistem Pengajuan ATK (Alat Tulis Kantor) Karyawan

Website sistem manajemen dan pengajuan alat tulis kantor (ATK) untuk karyawan perusahaan dengan arsitektur modern, modular, type-safe, dan production-ready.

---

## 1. Teknologi yang Digunakan

* **Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **ORM**: [Prisma ORM v7](https://www.prisma.io/) dengan `@prisma/adapter-pg`
* **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
* **Authentication**: HTTP-Only Cookie JWT (`jose`) & Password Hashing (`bcryptjs`)
* **Validasi**: [Zod](https://zod.dev/)
* **Font**: Inter (Google Fonts)

---

## 2. Struktur Arsitektur Sistem

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Root redirector
│   │   ├── layout.tsx                   # Root HTML layout & fonts
│   │   └── login/page.tsx               # Halaman login profesional + demo switcher
│   │
│   ├── user/                            # Portal Khusus Karyawan
│   │   ├── dashboard/page.tsx           # Ringkasan statistik & pengajuan terbaru
│   │   ├── pengajuan/
│   │   │   ├── page.tsx                 # Riwayat lengkap pengajuan user
│   │   │   └── buat/page.tsx            # Formulir pengajuan ATK + live stock
│   │   └── profile/page.tsx             # Informasi profil user
│   │
│   ├── admin/                           # Portal Khusus Administrator
│   │   ├── dashboard/page.tsx           # Statistik perusahaan & quick review
│   │   ├── pengajuan/
│   │   │   ├── page.tsx                 # Manajemen pengajuan + filter & review modal
│   │   │   └── [id]/page.tsx            # Detail audit & aksi pengajuan
│   │   ├── barang/page.tsx              # CRUD barang ATK & stok management
│   │   ├── karyawan/page.tsx            # CRUD karyawan, role, & reset password
│   │   └── laporan/page.tsx             # Analisis laporan & export print PDF
│   │
│   └── api/                             # Backend REST Route Handlers
│       ├── auth/                        # login, logout, me
│       ├── atk/                         # CRUD barang ATK & toggle status
│       ├── requests/                    # CRUD pengajuan, update status, stats, laporan
│       └── users/                       # CRUD karyawan, reset password, departments
│
├── components/
│   ├── ui/                              # Button, Input, Select, Textarea, Card, Badge, Modal, Table, Toast, Loading
│   └── layout/                          # Navbar, Sidebar, UserLayout, AdminLayout
│
├── lib/
│   ├── prisma.ts                        # Singleton Prisma Client dengan adapter pg pool
│   ├── auth.ts                          # Bcrypt hashing & Jose JWT utility
│   ├── session.ts                       # Cookie session management & guards
│   └── validation.ts                    # Zod schemas untuk semua input & request
│
├── services/                            # Business Logic Layer
│   ├── user.service.ts                  # Autentikasi & manajemen data user
│   ├── atk.service.ts                   # Manajemen barang ATK & stok
│   └── request.service.ts               # Transaksi pengajuan & pengurangan stok atomik
│
├── types/                               # TypeScript Type Definitions
│   ├── auth.ts
│   ├── user.ts
│   ├── atk.ts
│   └── request.ts
│
└── middleware.ts                        # Role-based route guard (/admin & /user)

prisma/
├── schema.prisma                        # Schema database PostgreSQL (User, AtkItem, AtkRequest)
└── seed.ts                              # Script seeding data demo (Admin, Karyawan, ATK catalog)
```

---

## 3. Akun Demo Bawaan (Default Credentials)

Database telah di-seed dengan data akun siap pakai:

| Role | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@company.com` | `Admin123!` | Akses penuh dashboard admin, kelola barang, karyawan, approval & laporan |
| **USER** | `user@company.com` | `User123!` | Akses dashboard karyawan, formulir pengajuan ATK, riwayat & profil |
| **USER** | `siti@company.com` | `User123!` | Karyawan HRD |
| **USER** | `ahmad@company.com` | `User123!` | Karyawan Marketing |
| **USER** | `dewi@company.com` | `User123!` | Karyawan Operasional |
| **USER** | `rudi@company.com` | `User123!` | Karyawan IT |

---

## 4. Panduan Konfigurasi Database Neon PostgreSQL

1. **Daftar / Masuk ke Neon**: Buka [https://neon.tech/](https://neon.tech/) dan buat project PostgreSQL baru.
2. **Ambil Connection String**: Salin connection string pooled format `postgresql://...` dari dashboard Neon.
3. **Konfigurasi File `.env`**: Buat file `.env` di root project:

```env
# Database Neon PostgreSQL
DATABASE_URL="postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Secret Key untuk Enkripsi Token JWT (minimal 32 karakter)
AUTH_SECRET="kunci-rahasia-jwt-sangat-aman-untuk-production-sistem-atk"
```

---

## 5. Instalasi & Menjalankan Aplikasi

### Langkah 1: Install Dependencies
```bash
npm install
```

### Langkah 2: Sinkronisasi Schema Database ke Neon
```bash
# Sinkronisasi schema Prisma ke PostgreSQL Neon
npx prisma db push
```

### Langkah 3: Generate Prisma Client
```bash
npx prisma generate
```

### Langkah 4: Jalankan Database Seed
```bash
# Mengisi database dengan akun admin, karyawan, dan 14 barang ATK default
npx tsx prisma/seed.ts
```

### Langkah 5: Jalankan Server Development
```bash
npm run dev
```

Buka peramban di `http://localhost:3000` (otomatis diarahkan ke `/login`).

---

## 6. Fitur Unggulan

1. **Alur Transaksi & Stok yang Aman (ACID)**:
   - Pengajuan awal berstatus `MENUNGGU` (stok belum dipotong).
   - Ketika Admin menekan **Setujui**, Prisma menjalankan transaksi `$transaction` untuk memeriksa ketersediaan stok fisik dan memotong stok secara atomik guna mencegah *race condition* atau *overdraft*.
2. **Kewajiban Catatan Penolakan**:
   - Jika permohonan ditolak (`DITOLAK`), modal mewajibkan admin mengisi alasan penolakan yang akan langsung tampil di riwayat pemohon.
3. **Soft Delete / Nonaktifkan Data**:
   - Data barang dan karyawan menggunakan flag `isActive: boolean` sehingga tidak merusak data integritas relasi foreign key pada riwayat pengajuan sebelumnya.
4. **Proteksi Role di Dua Lapisan**:
   - Lapisan Halaman: Ditangani oleh `middleware.ts` Next.js.
   - Lapisan API: Ditangani oleh verifikasi token dan pengecekan role di setiap Route Handler.
5. **Ekspor & Cetak Laporan**:
   - Halaman `/admin/laporan` menyediakan rekapitulasi data per departemen dan per jenis barang yang mendukung mode cetak ramah printer / PDF.

---

## 7. Build untuk Production

Untuk memvalidasi dan mem-build project untuk production:

```bash
# Type check & build bundle
npm run build

# Menjalankan production server
npm run start
```
