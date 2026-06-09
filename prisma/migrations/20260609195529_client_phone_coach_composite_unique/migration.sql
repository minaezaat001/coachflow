-- Drop the old unique constraint on phone
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_phone_key";

-- Add composite unique constraint for (phone, coachId)
-- First clean up any duplicate phone+coachId if they exist (shouldn't, but safety)
DELETE FROM "Client" a USING (
  SELECT MIN(id) as id, phone, "coachId"
  FROM "Client"
  GROUP BY phone, "coachId"
  HAVING COUNT(*) > 1
) b
WHERE a.phone = b.phone AND a."coachId" = b."coachId" AND a.id != b.id;

CREATE UNIQUE INDEX IF NOT EXISTS "Client_phone_coachId_key" ON "Client"("phone", "coachId");
