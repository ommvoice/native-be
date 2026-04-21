-- Revert event facility / kit / age / highlight storage from Postgres arrays to implicit M2M (matches venues & clubs).

-- CreateTable
CREATE TABLE "_GeneralFacilityToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GeneralFacilityToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_KidsFacilityToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KidsFacilityToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityEventToParentFacility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityEventToParentFacility_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AgeSuitabilityToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AgeSuitabilityToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExtraKitToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExtraKitToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityEventToSeasonalHighlight" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityEventToSeasonalHighlight_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_HighlightAttractionToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HighlightAttractionToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GeneralFacilityToOpportunityEvent_B_index" ON "_GeneralFacilityToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_KidsFacilityToOpportunityEvent_B_index" ON "_KidsFacilityToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_OpportunityEventToParentFacility_B_index" ON "_OpportunityEventToParentFacility"("B");

-- CreateIndex
CREATE INDEX "_AgeSuitabilityToOpportunityEvent_B_index" ON "_AgeSuitabilityToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_ExtraKitToOpportunityEvent_B_index" ON "_ExtraKitToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_OpportunityEventToSeasonalHighlight_B_index" ON "_OpportunityEventToSeasonalHighlight"("B");

-- CreateIndex
CREATE INDEX "_HighlightAttractionToOpportunityEvent_B_index" ON "_HighlightAttractionToOpportunityEvent"("B");

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityEvent" ADD CONSTRAINT "_GeneralFacilityToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_general_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityEvent" ADD CONSTRAINT "_GeneralFacilityToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityEvent" ADD CONSTRAINT "_KidsFacilityToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_kids_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityEvent" ADD CONSTRAINT "_KidsFacilityToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityEventToParentFacility" ADD CONSTRAINT "_OpportunityEventToParentFacility_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityEventToParentFacility" ADD CONSTRAINT "_OpportunityEventToParentFacility_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_parent_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityEvent" ADD CONSTRAINT "_AgeSuitabilityToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_age_suitabilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityEvent" ADD CONSTRAINT "_AgeSuitabilityToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityEvent" ADD CONSTRAINT "_ExtraKitToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_extra_kits"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityEvent" ADD CONSTRAINT "_ExtraKitToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityEventToSeasonalHighlight" ADD CONSTRAINT "_OpportunityEventToSeasonalHighlight_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityEventToSeasonalHighlight" ADD CONSTRAINT "_OpportunityEventToSeasonalHighlight_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_seasonal_highlights"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityEvent" ADD CONSTRAINT "_HighlightAttractionToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_highlight_attractions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityEvent" ADD CONSTRAINT "_HighlightAttractionToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy array columns into join tables ("A" / "B" match prior M2M migrations before arrays)
INSERT INTO "_GeneralFacilityToOpportunityEvent" ("A", "B")
SELECT DISTINCT slug, e.id
FROM "opportunity_events" e
CROSS JOIN LATERAL unnest(e."generalFacilitySlugs") AS slug
WHERE cardinality(e."generalFacilitySlugs") > 0;

INSERT INTO "_KidsFacilityToOpportunityEvent" ("A", "B")
SELECT DISTINCT slug, e.id
FROM "opportunity_events" e
CROSS JOIN LATERAL unnest(e."kidsFacilitySlugs") AS slug
WHERE cardinality(e."kidsFacilitySlugs") > 0;

INSERT INTO "_OpportunityEventToParentFacility" ("A", "B")
SELECT DISTINCT e.id, slug
FROM "opportunity_events" e
CROSS JOIN LATERAL unnest(e."parentFacilitySlugs") AS slug
WHERE cardinality(e."parentFacilitySlugs") > 0;

INSERT INTO "_AgeSuitabilityToOpportunityEvent" ("A", "B")
SELECT DISTINCT slug, e.id
FROM "opportunity_events" e
CROSS JOIN LATERAL unnest(e."ageSuitabilitySlugs") AS slug
WHERE cardinality(e."ageSuitabilitySlugs") > 0;

INSERT INTO "_ExtraKitToOpportunityEvent" ("A", "B")
SELECT DISTINCT slug, e.id
FROM "opportunity_events" e
CROSS JOIN LATERAL unnest(e."extraKitSlugs") AS slug
WHERE cardinality(e."extraKitSlugs") > 0;

INSERT INTO "_OpportunityEventToSeasonalHighlight" ("A", "B")
SELECT DISTINCT e.id, slug
FROM "opportunity_events" e
CROSS JOIN LATERAL unnest(e."seasonalHighlightSlugs") AS slug
WHERE cardinality(e."seasonalHighlightSlugs") > 0;

INSERT INTO "_HighlightAttractionToOpportunityEvent" ("A", "B")
SELECT DISTINCT slug, e.id
FROM "opportunity_events" e
CROSS JOIN LATERAL unnest(e."highlightAttractionSlugs") AS slug
WHERE cardinality(e."highlightAttractionSlugs") > 0;

-- AlterTable
ALTER TABLE "opportunity_events" DROP COLUMN "generalFacilitySlugs",
DROP COLUMN "kidsFacilitySlugs",
DROP COLUMN "parentFacilitySlugs",
DROP COLUMN "ageSuitabilitySlugs",
DROP COLUMN "extraKitSlugs",
DROP COLUMN "seasonalHighlightSlugs",
DROP COLUMN "highlightAttractionSlugs";
