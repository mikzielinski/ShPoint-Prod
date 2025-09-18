/*
  Warnings:

  - You are about to drop the column `status` on the `MissionCollection` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."MissionCollection_status_idx";

-- AlterTable
ALTER TABLE "public"."MissionCollection" DROP COLUMN "status",
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOwned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWishlist" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "invitedBy" TEXT;

-- DropEnum
DROP TYPE "public"."MissionStatus";

-- CreateTable
CREATE TABLE "public"."AllowedEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AllowedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedEmail_email_key" ON "public"."AllowedEmail"("email");

-- CreateIndex
CREATE INDEX "AllowedEmail_email_idx" ON "public"."AllowedEmail"("email");

-- CreateIndex
CREATE INDEX "AllowedEmail_role_idx" ON "public"."AllowedEmail"("role");

-- CreateIndex
CREATE INDEX "AllowedEmail_isActive_idx" ON "public"."AllowedEmail"("isActive");

-- CreateIndex
CREATE INDEX "MissionCollection_isOwned_idx" ON "public"."MissionCollection"("isOwned");

-- CreateIndex
CREATE INDEX "MissionCollection_isCompleted_idx" ON "public"."MissionCollection"("isCompleted");

-- CreateIndex
CREATE INDEX "MissionCollection_isWishlist_idx" ON "public"."MissionCollection"("isWishlist");

-- CreateIndex
CREATE INDEX "User_invitedBy_idx" ON "public"."User"("invitedBy");
