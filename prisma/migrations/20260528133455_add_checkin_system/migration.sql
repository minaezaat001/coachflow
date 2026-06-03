-- AlterTable
ALTER TABLE "Client" ADD COLUMN "nextCheckInDate" TEXT;

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN "coachComment" TEXT;
ALTER TABLE "Progress" ADD COLUMN "improvementsView" TEXT;
ALTER TABLE "Progress" ADD COLUMN "planAction" TEXT;
ALTER TABLE "Progress" ADD COLUMN "planFeedback" TEXT;

-- CreateTable
CREATE TABLE "ClientNotification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "coachId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientNotification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
