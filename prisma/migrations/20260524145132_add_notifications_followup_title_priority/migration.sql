-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coachId" TEXT NOT NULL,
    "clientId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "category" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Followup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'متابعة',
    "type" TEXT NOT NULL DEFAULT 'daily',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TEXT NOT NULL,
    "completedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Followup_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Followup" ("clientId", "completed", "completedAt", "createdAt", "id", "notes", "scheduledAt", "type") SELECT "clientId", "completed", "completedAt", "createdAt", "id", "notes", "scheduledAt", "type" FROM "Followup";
DROP TABLE "Followup";
ALTER TABLE "new_Followup" RENAME TO "Followup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
