-- CreateTable
CREATE TABLE "Package" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "defaultCheckInFrequency" INTEGER NOT NULL DEFAULT 7,
    "packageType" TEXT NOT NULL DEFAULT 'both',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxClients" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Package_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "weight" REAL,
    "height" REAL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "dietPlanUrl" TEXT,
    "workoutPlanUrl" TEXT,
    "subscriptionType" TEXT,
    "subscriptionStartDate" TEXT,
    "subscriptionEndDate" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "commitmentScore" INTEGER,
    "uniqueToken" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "packageId" INTEGER,
    "defaultCheckInFrequency" INTEGER DEFAULT 7,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Client_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("coachId", "commitmentScore", "createdAt", "dietPlanUrl", "goal", "height", "id", "name", "notes", "onboarded", "paymentStatus", "phone", "subscriptionEndDate", "subscriptionStartDate", "subscriptionStatus", "subscriptionType", "tags", "uniqueToken", "updatedAt", "weight", "workoutPlanUrl") SELECT "coachId", "commitmentScore", "createdAt", "dietPlanUrl", "goal", "height", "id", "name", "notes", "onboarded", "paymentStatus", "phone", "subscriptionEndDate", "subscriptionStartDate", "subscriptionStatus", "subscriptionType", "tags", "uniqueToken", "updatedAt", "weight", "workoutPlanUrl" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");
CREATE UNIQUE INDEX "Client_uniqueToken_key" ON "Client"("uniqueToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
