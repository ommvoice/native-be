-- AlterTable
ALTER TABLE "opportunity_venues" ADD COLUMN     "estimatedTimeToSpend" TEXT,
ADD COLUMN     "interestTags" TEXT,
ADD COLUMN     "seasonalTagSlug" TEXT;

-- CreateTable
CREATE TABLE "opportunity_parent_facilities" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_parent_facilities_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "_OpportunityVenueToParentFacility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityVenueToParentFacility_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityVenueToSeasonalHighlight" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityVenueToSeasonalHighlight_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GeneralFacilityToOpportunityVenue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GeneralFacilityToOpportunityVenue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_KidsFacilityToOpportunityVenue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KidsFacilityToOpportunityVenue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AgeSuitabilityToOpportunityVenue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AgeSuitabilityToOpportunityVenue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExtraKitToOpportunityVenue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExtraKitToOpportunityVenue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_HighlightAttractionToOpportunityVenue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HighlightAttractionToOpportunityVenue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_parent_facilities_label_key" ON "opportunity_parent_facilities"("label");

-- CreateIndex
CREATE INDEX "_OpportunityVenueToParentFacility_B_index" ON "_OpportunityVenueToParentFacility"("B");

-- CreateIndex
CREATE INDEX "_OpportunityVenueToSeasonalHighlight_B_index" ON "_OpportunityVenueToSeasonalHighlight"("B");

-- CreateIndex
CREATE INDEX "_GeneralFacilityToOpportunityVenue_B_index" ON "_GeneralFacilityToOpportunityVenue"("B");

-- CreateIndex
CREATE INDEX "_KidsFacilityToOpportunityVenue_B_index" ON "_KidsFacilityToOpportunityVenue"("B");

-- CreateIndex
CREATE INDEX "_AgeSuitabilityToOpportunityVenue_B_index" ON "_AgeSuitabilityToOpportunityVenue"("B");

-- CreateIndex
CREATE INDEX "_ExtraKitToOpportunityVenue_B_index" ON "_ExtraKitToOpportunityVenue"("B");

-- CreateIndex
CREATE INDEX "_HighlightAttractionToOpportunityVenue_B_index" ON "_HighlightAttractionToOpportunityVenue"("B");

-- AddForeignKey
ALTER TABLE "opportunity_venues" ADD CONSTRAINT "opportunity_venues_seasonalTagSlug_fkey" FOREIGN KEY ("seasonalTagSlug") REFERENCES "opportunity_seasonal_tags"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityVenueToParentFacility" ADD CONSTRAINT "_OpportunityVenueToParentFacility_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityVenueToParentFacility" ADD CONSTRAINT "_OpportunityVenueToParentFacility_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_parent_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityVenueToSeasonalHighlight" ADD CONSTRAINT "_OpportunityVenueToSeasonalHighlight_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityVenueToSeasonalHighlight" ADD CONSTRAINT "_OpportunityVenueToSeasonalHighlight_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_seasonal_highlights"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityVenue" ADD CONSTRAINT "_GeneralFacilityToOpportunityVenue_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_general_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityVenue" ADD CONSTRAINT "_GeneralFacilityToOpportunityVenue_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityVenue" ADD CONSTRAINT "_KidsFacilityToOpportunityVenue_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_kids_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityVenue" ADD CONSTRAINT "_KidsFacilityToOpportunityVenue_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityVenue" ADD CONSTRAINT "_AgeSuitabilityToOpportunityVenue_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_age_suitabilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityVenue" ADD CONSTRAINT "_AgeSuitabilityToOpportunityVenue_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityVenue" ADD CONSTRAINT "_ExtraKitToOpportunityVenue_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_extra_kits"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityVenue" ADD CONSTRAINT "_ExtraKitToOpportunityVenue_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityVenue" ADD CONSTRAINT "_HighlightAttractionToOpportunityVenue_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_highlight_attractions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityVenue" ADD CONSTRAINT "_HighlightAttractionToOpportunityVenue_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
