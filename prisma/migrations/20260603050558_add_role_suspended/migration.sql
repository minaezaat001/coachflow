-- AlterTable
ALTER TABLE "Progress" ADD COLUMN "arm" REAL;
ALTER TABLE "Progress" ADD COLUMN "backPhoto" TEXT;
ALTER TABLE "Progress" ADD COLUMN "chest" REAL;
ALTER TABLE "Progress" ADD COLUMN "frontPhoto" TEXT;
ALTER TABLE "Progress" ADD COLUMN "glutes" REAL;
ALTER TABLE "Progress" ADD COLUMN "inbodyPhoto" TEXT;
ALTER TABLE "Progress" ADD COLUMN "leg" REAL;
ALTER TABLE "Progress" ADD COLUMN "neck" REAL;
ALTER TABLE "Progress" ADD COLUMN "sidePhoto" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'coach',
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
