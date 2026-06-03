-- Rename Notification columns: category→type, read→isRead, link→targetUrl
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coachId" TEXT NOT NULL,
    "clientId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "targetUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Notification" ("id", "coachId", "clientId", "title", "message", "type", "isRead", "targetUrl", "createdAt")
SELECT "id", "coachId", "clientId", "title", "message", "category", "read", COALESCE("link", ''), "createdAt"
FROM "Notification";

DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
