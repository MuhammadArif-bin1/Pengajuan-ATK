# Dokumentasi Arsitektur Sistem Pengajuan ATK

Dokumen ini menjelaskan rancangan arsitektur, diagram aliran data, model basis data, mekanisme transaksi, dan pola desain sistem pada aplikasi **Sistem Pengajuan ATK (Alat Tulis Kantor)**.

---

## 1. Ikhtisar Arsitektur Sistem

Aplikasi dibangun menggunakan pola **Layered Architecture (Arsitektur Berlapis)** berbasis framework **Next.js App Router**, **TypeScript**, **Prisma ORM**, dan **Neon Serverless PostgreSQL**.

```mermaid
graph TD
    subgraph "Client Layer (Frontend)"
        UserPortal["Portal Karyawan (Publik - '/')\n• Form Pengajuan ATK\n• Pelacakan Status\n• Katalog Barang"]
        AdminPortal["Portal Admin (Terproteksi - '/admin')\n• Dashboard Statistik\n• Approval & Status Management\n• Kelola Barang & Karyawan\n• Laporan & Cetak PDF"]
    end

    subgraph "Security & Routing Layer"
        Middleware["Next.js Middleware (Proxy Guard)\n• Verifikasi Token JWT (jose)\n• Role-Based Access Control (ADMIN vs Public)"]
    end

    subgraph "Backend API Layer (Route Handlers)"
        AuthAPI["/api/auth/*\n(Login, Logout, Me)"]
        RequestAPI["/api/requests/*\n(Submit, Tracking, Status, Stats, Report)"]
        AtkAPI["/api/atk/*\n(CRUD Barang ATK, Toggle Status)"]
        UserAPI["/api/users/*\n(CRUD Karyawan, Reset Password, Depts)"]
    end

    subgraph "Business Logic & Service Layer"
        ReqService["request.service.ts\n• Atomic Stock $transaction\n• Status Transitions\n• Auto-create/find User"]
        AtkService["atk.service.ts\n• Inventory Management\n• Soft-delete Flag"]
        UserService["user.service.ts\n• Password Hashing (bcrypt)\n• Role & Session Management"]
    end

    subgraph "Data Access & Persistence Layer"
        PrismaClient["Prisma ORM Client v7\n(@prisma/adapter-pg + pg.Pool)"]
        PostgreSQL["Neon Serverless PostgreSQL\n(Tables: users, atk_items, atk_requests)"]
    end

    UserPortal -->|HTTP GET/POST| RequestAPI
    UserPortal -->|HTTP GET| AtkAPI
    AdminPortal -->|Auth Check| Middleware
    Middleware -->|Authorized| AdminPortal
    AdminPortal -->|HTTP REST| AuthAPI
    AdminPortal -->|HTTP REST| RequestAPI
    AdminPortal -->|HTTP REST| AtkAPI
    AdminPortal -->|HTTP REST| UserAPI

    AuthAPI --> UserService
    RequestAPI --> ReqService
    AtkAPI --> AtkService
    UserAPI --> UserService

    ReqService --> PrismaClient
    AtkService --> PrismaClient
    UserService --> PrismaClient

    PrismaClient --> PostgreSQL
```

---

## 2. Diagram Alur Transaksi Pengajuan

### A. Alur Karyawan (Public Submission & Tracking)
Karyawan dapat langsung mengakses portal tanpa perlu melakukan proses login:

```mermaid
sequenceDiagram
    autonumber
    actor Karyawan
    participant Frontend as Portal User (/)
    participant API as /api/requests
    participant Service as request.service.ts
    participant DB as Neon PostgreSQL

    Karyawan->>Frontend: Buka http://localhost:3000/
    Frontend->>API: GET /api/atk (Ambil katalog barang aktif)
    API->>DB: Query AtkItem (where isActive = true)
    DB-->>Frontend: List Barang + Real-time Stock
    
    Karyawan->>Frontend: Isi Data Pemohon, Pilih Barang, Jumlah, Alasan
    Karyawan->>Frontend: Klik "Kirim Pengajuan ATK"
    Frontend->>API: POST /api/requests {userName, userEmail, department, position, atkItemId, quantity, reason}
    API->>Service: createRequest()
    Service->>DB: Find or Create User (by email)
    Service->>DB: Check AtkItem Stock (stok >= diminta)
    Service->>DB: Insert AtkRequest (status: MENUNGGU)
    DB-->>Frontend: Response Sukses (Data Pengajuan + ID)
    Frontend-->>Karyawan: Tampilkan Notifikasi & Masuk ke Tab Riwayat
```

---

### B. Alur Peninjauan Administrator & Manajemen Status
Administrator mengakses URL khusus `/admin` untuk meninjau pengajuan dan memberikan keputusan:

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant AdminUI as Panel Admin (/admin)
    participant Auth as /api/auth/login
    participant API as /api/requests/[id]/status
    participant Service as request.service.ts
    participant DB as Neon PostgreSQL

    Admin->>AdminUI: Buka http://localhost:3000/admin
    Note over AdminUI: Middleware mendeteksi belum ada token -> Redirect ke /admin/login
    Admin->>Auth: POST {email, password}
    Auth->>DB: Verifikasi bcrypt & Role == ADMIN
    Auth-->>AdminUI: Set HTTP-Only Cookie JWT (atk-session)
    AdminUI->>AdminUI: Masuk ke Dashboard Admin
    
    Admin->>AdminUI: Pilih Pengajuan & Klik Status Baru:
    alt Pilihan: DISETUJUI (Setujui)
        AdminUI->>API: PATCH /api/requests/:id/status {status: "DISETUJUI"}
        API->>Service: updateRequestStatus()
        Service->>DB: BEGIN TRANSACTION (Prisma $transaction)
        Service->>DB: UPDATE AtkItem (stok = stok - quantity)
        Service->>DB: UPDATE AtkRequest (status = DISETUJUI, processedBy = adminId)
        Service->>DB: COMMIT TRANSACTION
    else Pilihan: DITOLAK (Tolak)
        AdminUI->>API: PATCH /api/requests/:id/status {status: "DITOLAK", adminNote: "Alasan..."}
        API->>Service: updateRequestStatus()
        Service->>DB: UPDATE AtkRequest (status = DITOLAK, adminNote = note)
    else Pilihan: DIPROSES / SELESAI
        AdminUI->>API: PATCH /api/requests/:id/status {status: "DIPROSES" / "SELESAI"}
        API->>Service: updateRequestStatus()
        Service->>DB: UPDATE AtkRequest (status = status, processedAt = now)
    end
    DB-->>AdminUI: Response Berhasil
    AdminUI-->>Admin: Tampilkan Toast Notifikasi & Perbarui Tabel
```

---

## 3. Diagram State Machine Status Pengajuan

Sistem mendukung 5 status pengajuan dengan aturan transisi yang terkelola:

```mermaid
stateDiagram-v2
    [*] --> MENUNGGU: Karyawan Membuat Pengajuan

    MENUNGGU --> DISETUJUI: Admin Klik "Setujui" (Stok Gudang Dipotong)
    MENUNGGU --> DITOLAK: Admin Klik "Tolak" (Wajib Catatan Alasan)

    DISETUJUI --> DIPROSES: Admin Menyiapkan Barang
    DISETUJUI --> DITOLAK: Dibatalkan (Stok Dikembalikan Otomatis)
    
    DIPROSES --> SELESAI: Barang Diterima Karyawan
    DIPROSES --> DITOLAK: Dibatalkan (Stok Dikembalikan Otomatis)

    SELESAI --> [*]
    DITOLAK --> [*]
```

---

## 4. Model Entity Relationship (ERD)

```mermaid
erDiagram
    users ||--o{ atk_requests : "mengajukan (userId)"
    users ||--o{ atk_requests : "memproses (processedBy)"
    atk_items ||--o{ atk_requests : "diajukan dalam (atkItemId)"

    users {
        string id PK "cuid"
        string name "Nama Karyawan"
        string email UK "Email unik"
        string password "Hashed bcrypt"
        enum role "ADMIN / USER"
        string department "Departemen/Divisi"
        string position "Jabatan"
        boolean isActive "Status Akif (Default true)"
        datetime createdAt
        datetime updatedAt
    }

    atk_items {
        string id PK "cuid"
        string name "Nama Barang ATK"
        string description "Deskripsi/Spesifikasi"
        int stock "Jumlah Stok Fisik"
        string unit "Satuan (pcs, rim, box, dll)"
        boolean isActive "Status Aktif (Default true)"
        datetime createdAt
        datetime updatedAt
    }

    atk_requests {
        string id PK "cuid"
        string userId FK "Relasi ke users.id"
        string atkItemId FK "Relasi ke atk_items.id"
        int quantity "Jumlah Diminta"
        string reason "Alasan/Keperluan"
        enum status "MENUNGGU, DISETUJUI, DIPROSES, SELESAI, DITOLAK"
        string adminNote "Catatan/Alasan Penolakan"
        string processedBy FK "Relasi ke users.id (Admin)"
        datetime processedAt "Waktu Pemrosesan"
        datetime createdAt
        datetime updatedAt
    }
```

---

## 5. Komponen & Struktur Direktori

```text
src/
├── app/
│   ├── page.tsx                         # Portal Karyawan Publik (Form, Status, Katalog)
│   ├── layout.tsx                       # Root Layout HTML + ToastProvider + Inter Font
│   ├── admin/
│   │   ├── login/page.tsx               # Login Khusus Administrator
│   │   ├── dashboard/page.tsx           # Dashboard Admin & Quick Status Review
│   │   ├── pengajuan/                   # Manajemen Pengajuan & Filter Lengkap
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx            # Detail Audit & Ubah Status
│   │   ├── barang/page.tsx              # CRUD Barang ATK & Stok
│   │   ├── karyawan/page.tsx            # CRUD Data Karyawan & Reset Password
│   │   └── laporan/page.tsx             # Analisis Rekapitulasi & Ekspor PDF
│   └── api/                             # REST API Route Handlers
│       ├── auth/login, logout, me       # Manajemen Autentikasi
│       ├── atk/                         # Data Barang ATK
│       ├── requests/                    # Transaksi Pengajuan, Stats, Laporan
│       └── users/                       # Data Karyawan & Departemen
├── components/
│   ├── ui/                              # Button, Input, Select, Textarea, Card, Badge, Modal, Table, Toast
│   └── layout/                          # Navbar, Sidebar, AdminLayout
├── lib/
│   ├── prisma.ts                        # PostgreSQL Pooler & Prisma Adapter
│   ├── auth.ts                          # JWT Token & Bcrypt Hashing
│   ├── session.ts                       # Cookie Session Reader & Guard
│   └── validation.ts                    # Zod Schemas
├── services/                            # Business Logic Services
│   ├── request.service.ts               # Transaksi Pengajuan & Stok Atomik
│   ├── atk.service.ts                   # Manajemen Persediaan Barang
│   └── user.service.ts                  # Manajemen Pengguna
└── middleware.ts                        # Route Protection & Role Verification
```
