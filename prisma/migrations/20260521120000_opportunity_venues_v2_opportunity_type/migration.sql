-- AlterTable
ALTER TABLE "opportunity_venues_v2" ADD COLUMN "opportunity_type" "OpportunityRecordType" NOT NULL DEFAULT 'venue';

-- CreateIndex
CREATE INDEX "opportunity_venues_v2_opportunity_type_idx" ON "opportunity_venues_v2"("opportunity_type");
