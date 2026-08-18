-- ==========================================================
-- SKEMA DATABASE SISTEM PENGAJUAN ATK (POSTGRESQL / NEON)
-- ==========================================================

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS "public";

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RequestStatus" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'DIPROSES', 'SELESAI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 4. Create ATK Items Table
CREATE TABLE IF NOT EXISTS "atk_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atk_items_pkey" PRIMARY KEY ("id")
);

-- 5. Create ATK Requests Table
CREATE TABLE IF NOT EXISTS "atk_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "atkItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'MENUNGGU',
    "adminNote" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atk_requests_pkey" PRIMARY KEY ("id")
);

-- 6. Create Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- 7. Add Foreign Keys
DO $$ BEGIN
    ALTER TABLE "atk_requests" ADD CONSTRAINT "atk_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "atk_requests" ADD CONSTRAINT "atk_requests_atkItemId_fkey" FOREIGN KEY ("atkItemId") REFERENCES "atk_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "atk_requests" ADD CONSTRAINT "atk_requests_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
