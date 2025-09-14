-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('OWNED', 'PAINTED', 'WISHLIST');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'GUEST';

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'OWNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collection_userId_idx" ON "public"."Collection"("userId");

-- CreateIndex
CREATE INDEX "Collection_createdAt_idx" ON "public"."Collection"("createdAt");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_idx" ON "public"."CollectionItem"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionItem_cardId_idx" ON "public"."CollectionItem"("cardId");

-- CreateIndex
CREATE INDEX "CollectionItem_status_idx" ON "public"."CollectionItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_collectionId_cardId_key" ON "public"."CollectionItem"("collectionId", "cardId");

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
