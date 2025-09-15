-- CreateEnum
CREATE TYPE "public"."CollectionStatus" AS ENUM ('OWNED', 'PAINTED', 'WISHLIST', 'SOLD');

-- CreateTable
CREATE TABLE "public"."CharacterCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "status" "public"."CollectionStatus" NOT NULL DEFAULT 'OWNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SetCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "status" "public"."CollectionStatus" NOT NULL DEFAULT 'OWNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterCollection_userId_idx" ON "public"."CharacterCollection"("userId");

-- CreateIndex
CREATE INDEX "CharacterCollection_characterId_idx" ON "public"."CharacterCollection"("characterId");

-- CreateIndex
CREATE INDEX "CharacterCollection_status_idx" ON "public"."CharacterCollection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterCollection_userId_characterId_key" ON "public"."CharacterCollection"("userId", "characterId");

-- CreateIndex
CREATE INDEX "SetCollection_userId_idx" ON "public"."SetCollection"("userId");

-- CreateIndex
CREATE INDEX "SetCollection_setId_idx" ON "public"."SetCollection"("setId");

-- CreateIndex
CREATE INDEX "SetCollection_status_idx" ON "public"."SetCollection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SetCollection_userId_setId_key" ON "public"."SetCollection"("userId", "setId");

-- AddForeignKey
ALTER TABLE "public"."CharacterCollection" ADD CONSTRAINT "CharacterCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SetCollection" ADD CONSTRAINT "SetCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
