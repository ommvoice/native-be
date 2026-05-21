-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN     "adultCost" DECIMAL(10,2),
ADD COLUMN     "childCost" DECIMAL(10,2),
ADD COLUMN     "infantCost" DECIMAL(10,2),
ADD COLUMN     "parkingProvisionSlug" TEXT,
ADD COLUMN     "venueSettingSlug" TEXT;

-- CreateTable
CREATE TABLE "opportunity_parking_provisions" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_parking_provisions_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_venue_settings" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_venue_settings_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_general_facilities" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_general_facilities_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_kids_facilities" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_kids_facilities_pkey" PRIMARY KEY ("slug")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_parking_provisions_label_key" ON "opportunity_parking_provisions"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_venue_settings_label_key" ON "opportunity_venue_settings"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_general_facilities_label_key" ON "opportunity_general_facilities"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_kids_facilities_label_key" ON "opportunity_kids_facilities"("label");

-- CreateIndex
CREATE INDEX "_GeneralFacilityToOpportunityEvent_B_index" ON "_GeneralFacilityToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_KidsFacilityToOpportunityEvent_B_index" ON "_KidsFacilityToOpportunityEvent"("B");

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_parkingProvisionSlug_fkey" FOREIGN KEY ("parkingProvisionSlug") REFERENCES "opportunity_parking_provisions"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_venueSettingSlug_fkey" FOREIGN KEY ("venueSettingSlug") REFERENCES "opportunity_venue_settings"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityEvent" ADD CONSTRAINT "_GeneralFacilityToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_general_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneralFacilityToOpportunityEvent" ADD CONSTRAINT "_GeneralFacilityToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityEvent" ADD CONSTRAINT "_KidsFacilityToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_kids_facilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KidsFacilityToOpportunityEvent" ADD CONSTRAINT "_KidsFacilityToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
