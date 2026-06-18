-- Reconcile drift: Followup table was re-added, age column added
-- The Followup table, composite unique index, and other changes
-- were applied via db push and manual SQL; this migration
-- reconciles the migration history to match actual DB state.

-- The age column was already added in the DB via direct SQL.
-- This migration is a placeholder to align migration history
-- with the actual database schema (which is already in sync).

-- Re-create Followup table (if for some reason it doesn't exist)
CREATE TABLE IF NOT EXISTS "Followup" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "scheduledDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Followup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Followup_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Followup_clientId_idx" ON "Followup"("clientId");
CREATE INDEX IF NOT EXISTS "Followup_status_idx" ON "Followup"("status");

-- Add age column if not exists
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "age" INTEGER;

-- Ensure composite unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS "Client_phone_coachId_key" ON "Client"("phone", "coachId");
