-- AlterTable
ALTER TABLE "ScheduledGame" ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "skillLevel" TEXT,
ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "totalCost" DOUBLE PRECISION,
ADD COLUMN "currency" TEXT DEFAULT 'PLN';

-- CreateIndex
CREATE INDEX "ScheduledGame_city_idx" ON "ScheduledGame"("city");

-- CreateIndex
CREATE INDEX "ScheduledGame_country_idx" ON "ScheduledGame"("country");

-- CreateIndex
CREATE INDEX "ScheduledGame_city_country_idx" ON "ScheduledGame"("city", "country");

