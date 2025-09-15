-- CreateEnum
CREATE TYPE "public"."StrikeTeamType" AS ENUM ('MY_TEAMS', 'DREAM_TEAMS');

-- CreateEnum
CREATE TYPE "public"."CharacterRole" AS ENUM ('PRIMARY', 'SECONDARY', 'SUPPORT');

-- AlterEnum
ALTER TYPE "public"."CollectionStatus" ADD VALUE 'FAVORITE';

-- CreateTable
CREATE TABLE "public"."StrikeTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."StrikeTeamType" NOT NULL DEFAULT 'MY_TEAMS',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrikeTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StrikeTeamCharacter" (
    "id" TEXT NOT NULL,
    "strikeTeamId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "role" "public"."CharacterRole" NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrikeTeamCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrikeTeam_userId_idx" ON "public"."StrikeTeam"("userId");

-- CreateIndex
CREATE INDEX "StrikeTeam_type_idx" ON "public"."StrikeTeam"("type");

-- CreateIndex
CREATE INDEX "StrikeTeamCharacter_strikeTeamId_idx" ON "public"."StrikeTeamCharacter"("strikeTeamId");

-- CreateIndex
CREATE INDEX "StrikeTeamCharacter_characterId_idx" ON "public"."StrikeTeamCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "StrikeTeamCharacter_strikeTeamId_characterId_key" ON "public"."StrikeTeamCharacter"("strikeTeamId", "characterId");

-- AddForeignKey
ALTER TABLE "public"."StrikeTeam" ADD CONSTRAINT "StrikeTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StrikeTeamCharacter" ADD CONSTRAINT "StrikeTeamCharacter_strikeTeamId_fkey" FOREIGN KEY ("strikeTeamId") REFERENCES "public"."StrikeTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
