-- CreateTable
CREATE TABLE "opportunity_days_of_week" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_days_of_week_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_club_formats" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_club_formats_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_club_frequencies" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_club_frequencies_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_commitments" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_commitments_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "themeSlug" TEXT NOT NULL,
    "themeVariantSlug" TEXT,
    "venuePostCode" VARCHAR(10),
    "startTime" VARCHAR(5),
    "finishTime" VARCHAR(5),
    "dayOfWeekSlug" TEXT,
    "activityGroupSlug" TEXT,
    "clubFormatSlug" TEXT,
    "clubFrequencySlug" TEXT,
    "commitmentSlug" TEXT,
    "skillAreaSlug" TEXT,
    "skillAreaVariant" TEXT,
    "abilityLevelSlug" TEXT,
    "parkingProvisionSlug" TEXT,
    "venueSettingSlug" TEXT,
    "adultCost" DECIMAL(10,2),
    "childCost" DECIMAL(10,2),
    "infantCost" DECIMAL(10,2),
    "interestTags" TEXT,
    "seasonalTagSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GeneralFacilityToOpportunityClub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GeneralFacilityToOpportunityClub_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_KidsFacilityToOpportunityClub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KidsFacilityToOpportunityClub_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AgeSuitabilityToOpportunityClub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AgeSuitabilityToOpportunityClub_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExtraKitToOpportunityClub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExtraKitToOpportunityClub_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_HighlightAttractionToOpportunityClub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HighlightAttractionToOpportunityClub_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityClubToParentFacility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityClubToParentFacility_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityClubToSeasonalHighlight" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityClubToSeasonalHighlight_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_days_of_week_label_key" ON "opportunity_days_of_week"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_club_formats_label_key" ON "opportunity_club_formats"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_club_frequencies_label_key" ON "opportunity_club_frequencies"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_commitments_label_key" ON "opportunity_commitments"("label");

-- CreateIndex
CREATE INDEX "opportunity_clubs_themeSlug_idx" ON "opportunity_clubs"("themeSlug");

-- CreateIndex
CREATE INDEX "opportunity_clubs_activityGroupSlug_idx" ON "opportunity_clubs"("activityGroupSlug");

-- CreateIndex
CREATE INDEX "opportunity_clubs_dayOfWeekSlug_idx" ON "opportunity_clubs"("dayOfWeekSlug");

-- CreateIndex
CREATE INDEX "_GeneralFacilityToOpportunityClub_B_index" ON "_GeneralFacilityToOpportunityClub"("B");

-- CreateIndex
CREATE INDEX "_KidsFacilityToOpportunityClub_B_index" ON "_KidsFacilityToOpportunityClub"("B");

-- CreateIndex
CREATE INDEX "_AgeSuitabilityToOpportunityClub_B_index" ON "_AgeSuitabilityToOpportunityClub"("B");

-- CreateIndex
CREATE INDEX "_ExtraKitToOpportunityClub_B_index" ON "_ExtraKitToOpportunityClub"("B");

-- CreateIndex
CREATE INDEX "_HighlightAttractionToOpportunityClub_B_index" ON "_HighlightAttractionToOpportunityClub"("B");

-- CreateIndex
CREATE INDEX "_OpportunityClubToParentFacility_B_index" ON "_OpportunityClubToParentFacility"("B");

-- CreateIndex
CREATE INDEX "_OpportunityClubToSeasonalHighlight_B_index" ON "_OpportunityClubToSeasonalHighlight"("B");

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_themeSlug_fkey" FOREIGN KEY ("themeSlug") REFERENCES "opportunity_themes"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_themeVariantSlug_fkey" FOREIGN KEY ("themeVariantSlug") REFERENCES "opportunity_theme_variants"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_dayOfWeekSlug_fkey" FOREIGN KEY ("dayOfWeekSlug") REFERENCES "opportunity_days_of_week"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_activityGroupSlug_fkey" FOREIGN KEY ("activityGroupSlug") REFERENCES "opportunity_activity_groups"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_clubFormatSlug_fkey" FOREIGN KEY ("clubFormatSlug") REFERENCES "opportunity_club_formats"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_clubFrequencySlug_fkey" FOREIGN KEY ("clubFrequencySlug") REFERENCES "opportunity_club_frequencies"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_commitmentSlug_fkey" FOREIGN KEY ("commitmentSlug") REFERENCES "opportunity_commitments"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_skillAreaSlug_fkey" FOREIGN KEY ("skillAreaSlug") REFERENCES "opportunity_skill_areas"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_abilityLevelSlug_fkey" FOREIGN KEY ("abilityLevelSlug") REFERENCES "opportunity_ability_levels"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_parkingProvisionSlug_fkey" FOREIGN KEY ("parkingProvisionSlug") REFERENCES "opportunity_parking_provisions"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_venueSettingSlug_fkey" FOREIGN KEY ("venueSettingSlug") REFERENCES "opportunity_venue_settings"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_clubs" ADD CONSTRAINT "opportunity_clubs_seasonalTagSlug_fkey" FOREIGN KEY ("seasonalTagSlug") REFERENCES "opportunity_seasonal_tags"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityClub" ADD CONSTRAINT "_GeneralFacilityToOpportunityClub_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_general_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityClub" ADD CONSTRAINT "_GeneralFacilityToOpportunityClub_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityClub" ADD CONSTRAINT "_KidsFacilityToOpportunityClub_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_kids_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityClub" ADD CONSTRAINT "_KidsFacilityToOpportunityClub_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityClub" ADD CONSTRAINT "_AgeSuitabilityToOpportunityClub_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_age_suitabilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityClub" ADD CONSTRAINT "_AgeSuitabilityToOpportunityClub_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityClub" ADD CONSTRAINT "_ExtraKitToOpportunityClub_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_extra_kits"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityClub" ADD CONSTRAINT "_ExtraKitToOpportunityClub_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityClub" ADD CONSTRAINT "_HighlightAttractionToOpportunityClub_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_highlight_attractions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityClub" ADD CONSTRAINT "_HighlightAttractionToOpportunityClub_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityClubToParentFacility" ADD CONSTRAINT "_OpportunityClubToParentFacility_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityClubToParentFacility" ADD CONSTRAINT "_OpportunityClubToParentFacility_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_parent_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityClubToSeasonalHighlight" ADD CONSTRAINT "_OpportunityClubToSeasonalHighlight_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityClubToSeasonalHighlight" ADD CONSTRAINT "_OpportunityClubToSeasonalHighlight_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_seasonal_highlights"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
