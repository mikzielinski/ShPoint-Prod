-- CreateEnum
CREATE TYPE "public"."MissionStatus" AS ENUM ('OWNED', 'COMPLETED', 'WISHLIST', 'LOCKED');

-- CreateTable
CREATE TABLE "public"."MissionCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" "public"."MissionStatus" NOT NULL DEFAULT 'OWNED',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionCollection_userId_idx" ON "public"."MissionCollection"("userId");

-- CreateIndex
CREATE INDEX "MissionCollection_missionId_idx" ON "public"."MissionCollection"("missionId");

-- CreateIndex
CREATE INDEX "MissionCollection_status_idx" ON "public"."MissionCollection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MissionCollection_userId_missionId_key" ON "public"."MissionCollection"("userId", "missionId");

-- AddForeignKey
ALTER TABLE "public"."MissionCollection" ADD CONSTRAINT "MissionCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
