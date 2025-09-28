-- CreateEnum
CREATE TYPE "public"."CustomCardStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SHARED');

-- CreateEnum
CREATE TYPE "public"."EntityType" AS ENUM ('USER', 'CARD', 'CHARACTER', 'MISSION', 'SET', 'STRIKE_TEAM', 'CUSTOM_CARD', 'COLLECTION', 'SYSTEM_SETTINGS');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'STATUS_CHANGE', 'PUBLISH', 'UNPUBLISH', 'SHARE', 'UNSHARE');

-- CreateTable
CREATE TABLE "public"."CustomMadeCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "faction" TEXT NOT NULL,
    "unitType" "public"."CharacterRole" NOT NULL,
    "squadPoints" INTEGER NOT NULL,
    "stamina" INTEGER NOT NULL,
    "durability" INTEGER NOT NULL,
    "force" INTEGER,
    "hanker" INTEGER,
    "abilities" JSONB,
    "stances" JSONB,
    "portrait" TEXT,
    "status" "public"."CustomCardStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomMadeCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomCardShare" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomCardShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomCardCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "isOwned" BOOLEAN NOT NULL DEFAULT false,
    "isPainted" BOOLEAN NOT NULL DEFAULT false,
    "isWishlist" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomCardCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" "public"."EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "userId" TEXT,
    "changes" JSONB,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomMadeCard_authorId_idx" ON "public"."CustomMadeCard"("authorId");

-- CreateIndex
CREATE INDEX "CustomMadeCard_status_idx" ON "public"."CustomMadeCard"("status");

-- CreateIndex
CREATE INDEX "CustomMadeCard_isPublic_idx" ON "public"."CustomMadeCard"("isPublic");

-- CreateIndex
CREATE INDEX "CustomMadeCard_faction_idx" ON "public"."CustomMadeCard"("faction");

-- CreateIndex
CREATE INDEX "CustomMadeCard_unitType_idx" ON "public"."CustomMadeCard"("unitType");

-- CreateIndex
CREATE INDEX "CustomCardShare_cardId_idx" ON "public"."CustomCardShare"("cardId");

-- CreateIndex
CREATE INDEX "CustomCardShare_sharedWithId_idx" ON "public"."CustomCardShare"("sharedWithId");

-- CreateIndex
CREATE INDEX "CustomCardShare_accepted_idx" ON "public"."CustomCardShare"("accepted");

-- CreateIndex
CREATE UNIQUE INDEX "CustomCardShare_cardId_sharedWithId_key" ON "public"."CustomCardShare"("cardId", "sharedWithId");

-- CreateIndex
CREATE INDEX "CustomCardCollection_userId_idx" ON "public"."CustomCardCollection"("userId");

-- CreateIndex
CREATE INDEX "CustomCardCollection_cardId_idx" ON "public"."CustomCardCollection"("cardId");

-- CreateIndex
CREATE INDEX "CustomCardCollection_isOwned_idx" ON "public"."CustomCardCollection"("isOwned");

-- CreateIndex
CREATE INDEX "CustomCardCollection_isPainted_idx" ON "public"."CustomCardCollection"("isPainted");

-- CreateIndex
CREATE INDEX "CustomCardCollection_isWishlist_idx" ON "public"."CustomCardCollection"("isWishlist");

-- CreateIndex
CREATE UNIQUE INDEX "CustomCardCollection_userId_cardId_key" ON "public"."CustomCardCollection"("userId", "cardId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."CustomMadeCard" ADD CONSTRAINT "CustomMadeCard_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomCardShare" ADD CONSTRAINT "CustomCardShare_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."CustomMadeCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomCardShare" ADD CONSTRAINT "CustomCardShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomCardCollection" ADD CONSTRAINT "CustomCardCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomCardCollection" ADD CONSTRAINT "CustomCardCollection_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."CustomMadeCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
