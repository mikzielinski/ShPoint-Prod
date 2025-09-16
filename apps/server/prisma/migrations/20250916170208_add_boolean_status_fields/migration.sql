/*
  Warnings:

  - You are about to drop the column `status` on the `CharacterCollection` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `SetCollection` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."CharacterCollection_status_idx";

-- DropIndex
DROP INDEX "public"."SetCollection_status_idx";

-- AlterTable
ALTER TABLE "public"."CharacterCollection" DROP COLUMN "status",
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOwned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPainted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWishlist" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."SetCollection" DROP COLUMN "status",
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOwned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPainted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWishlist" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CharacterCollection_isOwned_idx" ON "public"."CharacterCollection"("isOwned");

-- CreateIndex
CREATE INDEX "CharacterCollection_isPainted_idx" ON "public"."CharacterCollection"("isPainted");

-- CreateIndex
CREATE INDEX "CharacterCollection_isWishlist_idx" ON "public"."CharacterCollection"("isWishlist");

-- CreateIndex
CREATE INDEX "SetCollection_isOwned_idx" ON "public"."SetCollection"("isOwned");

-- CreateIndex
CREATE INDEX "SetCollection_isPainted_idx" ON "public"."SetCollection"("isPainted");

-- CreateIndex
CREATE INDEX "SetCollection_isWishlist_idx" ON "public"."SetCollection"("isWishlist");
