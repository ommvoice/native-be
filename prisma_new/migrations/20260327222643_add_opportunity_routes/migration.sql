-- CreateTable
CREATE TABLE "opportunity_route_types" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_route_types_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_route_suitabilities" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_route_suitabilities_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_difficulty_ratings" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_difficulty_ratings_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_dog_facilities" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_dog_facilities_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "themeSlug" TEXT NOT NULL,
    "themeVariantSlug" TEXT,
    "routeTypeSlug" TEXT,
    "routeSuitabilitySlug" TEXT,
    "routeDistanceMiles" DECIMAL(5,2),
    "terrainTypeSlug" TEXT,
    "difficultyRatingSlug" TEXT,
    "activityGroupSlug" TEXT,
    "startPointPostCode" VARCHAR(10),
    "parkingProvisionSlug" TEXT,
    "venueSettingSlug" TEXT,
    "adultCost" DECIMAL(10,2),
    "childCost" DECIMAL(10,2),
    "infantCost" DECIMAL(10,2),
    "interestTags" TEXT,
    "seasonalTagSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GeneralFacilityToOpportunityRoute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GeneralFacilityToOpportunityRoute_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_KidsFacilityToOpportunityRoute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KidsFacilityToOpportunityRoute_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExtraKitToOpportunityRoute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExtraKitToOpportunityRoute_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_HighlightAttractionToOpportunityRoute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HighlightAttractionToOpportunityRoute_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DogFacilityToOpportunityRoute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DogFacilityToOpportunityRoute_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityRouteToParentFacility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityRouteToParentFacility_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityRouteToSeasonalHighlight" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityRouteToSeasonalHighlight_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_route_types_label_key" ON "opportunity_route_types"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_route_suitabilities_label_key" ON "opportunity_route_suitabilities"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_difficulty_ratings_label_key" ON "opportunity_difficulty_ratings"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_dog_facilities_label_key" ON "opportunity_dog_facilities"("label");

-- CreateIndex
CREATE INDEX "opportunity_routes_themeSlug_idx" ON "opportunity_routes"("themeSlug");

-- CreateIndex
CREATE INDEX "opportunity_routes_activityGroupSlug_idx" ON "opportunity_routes"("activityGroupSlug");

-- CreateIndex
CREATE INDEX "opportunity_routes_routeTypeSlug_idx" ON "opportunity_routes"("routeTypeSlug");

-- CreateIndex
CREATE INDEX "_GeneralFacilityToOpportunityRoute_B_index" ON "_GeneralFacilityToOpportunityRoute"("B");

-- CreateIndex
CREATE INDEX "_KidsFacilityToOpportunityRoute_B_index" ON "_KidsFacilityToOpportunityRoute"("B");

-- CreateIndex
CREATE INDEX "_ExtraKitToOpportunityRoute_B_index" ON "_ExtraKitToOpportunityRoute"("B");

-- CreateIndex
CREATE INDEX "_HighlightAttractionToOpportunityRoute_B_index" ON "_HighlightAttractionToOpportunityRoute"("B");

-- CreateIndex
CREATE INDEX "_DogFacilityToOpportunityRoute_B_index" ON "_DogFacilityToOpportunityRoute"("B");

-- CreateIndex
CREATE INDEX "_OpportunityRouteToParentFacility_B_index" ON "_OpportunityRouteToParentFacility"("B");

-- CreateIndex
CREATE INDEX "_OpportunityRouteToSeasonalHighlight_B_index" ON "_OpportunityRouteToSeasonalHighlight"("B");

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_themeSlug_fkey" FOREIGN KEY ("themeSlug") REFERENCES "opportunity_themes"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_themeVariantSlug_fkey" FOREIGN KEY ("themeVariantSlug") REFERENCES "opportunity_theme_variants"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_routeTypeSlug_fkey" FOREIGN KEY ("routeTypeSlug") REFERENCES "opportunity_route_types"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_routeSuitabilitySlug_fkey" FOREIGN KEY ("routeSuitabilitySlug") REFERENCES "opportunity_route_suitabilities"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_terrainTypeSlug_fkey" FOREIGN KEY ("terrainTypeSlug") REFERENCES "opportunity_terrain_types"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_difficultyRatingSlug_fkey" FOREIGN KEY ("difficultyRatingSlug") REFERENCES "opportunity_difficulty_ratings"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_activityGroupSlug_fkey" FOREIGN KEY ("activityGroupSlug") REFERENCES "opportunity_activity_groups"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_parkingProvisionSlug_fkey" FOREIGN KEY ("parkingProvisionSlug") REFERENCES "opportunity_parking_provisions"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_venueSettingSlug_fkey" FOREIGN KEY ("venueSettingSlug") REFERENCES "opportunity_venue_settings"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_routes" ADD CONSTRAINT "opportunity_routes_seasonalTagSlug_fkey" FOREIGN KEY ("seasonalTagSlug") REFERENCES "opportunity_seasonal_tags"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityRoute" ADD CONSTRAINT "_GeneralFacilityToOpportunityRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_general_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityRoute" ADD CONSTRAINT "_GeneralFacilityToOpportunityRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityRoute" ADD CONSTRAINT "_KidsFacilityToOpportunityRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_kids_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityRoute" ADD CONSTRAINT "_KidsFacilityToOpportunityRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityRoute" ADD CONSTRAINT "_ExtraKitToOpportunityRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_extra_kits"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityRoute" ADD CONSTRAINT "_ExtraKitToOpportunityRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityRoute" ADD CONSTRAINT "_HighlightAttractionToOpportunityRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_highlight_attractions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityRoute" ADD CONSTRAINT "_HighlightAttractionToOpportunityRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DogFacilityToOpportunityRoute" ADD CONSTRAINT "_DogFacilityToOpportunityRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_dog_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DogFacilityToOpportunityRoute" ADD CONSTRAINT "_DogFacilityToOpportunityRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToParentFacility" ADD CONSTRAINT "_OpportunityRouteToParentFacility_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToParentFacility" ADD CONSTRAINT "_OpportunityRouteToParentFacility_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_parent_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToSeasonalHighlight" ADD CONSTRAINT "_OpportunityRouteToSeasonalHighlight_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToSeasonalHighlight" ADD CONSTRAINT "_OpportunityRouteToSeasonalHighlight_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_seasonal_highlights"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
