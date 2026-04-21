-- AlterTable
ALTER TABLE "opportunity_venues" ADD COLUMN     "activityGroupSlug" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "openingDaysAndTimes" TEXT,
ADD COLUMN     "openingExclusions" TEXT,
ADD COLUMN     "venuePostcode" VARCHAR(10);

-- CreateIndex
CREATE INDEX "opportunity_venues_activityGroupSlug_idx" ON "opportunity_venues"("activityGroupSlug");

-- AddForeignKey
ALTER TABLE "opportunity_venues" ADD CONSTRAINT "opportunity_venues_activityGroupSlug_fkey" FOREIGN KEY ("activityGroupSlug") REFERENCES "opportunity_activity_groups"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
