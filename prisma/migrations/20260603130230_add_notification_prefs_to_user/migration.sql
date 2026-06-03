-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyPayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySubExpiry" BOOLEAN NOT NULL DEFAULT true;
