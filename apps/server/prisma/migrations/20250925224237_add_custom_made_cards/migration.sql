-- AlterTable
ALTER TABLE "public"."AllowedEmail" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."CharacterCollection" ADD COLUMN     "deaths" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kills" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."StrikeTeam" ADD COLUMN     "draws" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "squad1Name" TEXT NOT NULL DEFAULT 'Squad 1',
ADD COLUMN     "squad2Name" TEXT NOT NULL DEFAULT 'Squad 2',
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."StrikeTeamCharacter" ADD COLUMN     "characterName" TEXT,
ADD COLUMN     "unitCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "invitationsLimit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invitationsSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastInvitationSentAt" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedBy" TEXT,
ADD COLUMN     "suspendedReason" TEXT,
ADD COLUMN     "suspendedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "public"."SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "public"."SystemSettings"("key");

-- CreateIndex
CREATE INDEX "AllowedEmail_invitedBy_idx" ON "public"."AllowedEmail"("invitedBy");

-- CreateIndex
CREATE INDEX "AllowedEmail_usedAt_idx" ON "public"."AllowedEmail"("usedAt");

-- CreateIndex
CREATE INDEX "AllowedEmail_expiresAt_idx" ON "public"."AllowedEmail"("expiresAt");

-- CreateIndex
CREATE INDEX "StrikeTeam_isPublished_idx" ON "public"."StrikeTeam"("isPublished");

-- CreateIndex
CREATE INDEX "StrikeTeamCharacter_characterName_idx" ON "public"."StrikeTeamCharacter"("characterName");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_suspendedUntil_idx" ON "public"."User"("suspendedUntil");

-- CreateIndex
CREATE INDEX "User_suspendedBy_idx" ON "public"."User"("suspendedBy");

-- CreateIndex
CREATE INDEX "User_invitationsSent_idx" ON "public"."User"("invitationsSent");

-- CreateIndex
CREATE INDEX "User_invitationsLimit_idx" ON "public"."User"("invitationsLimit");
