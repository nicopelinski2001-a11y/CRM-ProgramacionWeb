-- Migración aditiva: conserva los usuarios y las tareas existentes.
CREATE TYPE "CustomerStatus" AS ENUM ('PROSPECT', 'FOLLOW_UP', 'CLIENT');

CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'PROSPECT',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_userId_idx" ON "customers"("userId");

ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
