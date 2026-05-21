-- AlterTable
ALTER TABLE "opportunity_venues" ADD COLUMN     "adultCost" DECIMAL(10,2),
ADD COLUMN     "childCost" DECIMAL(10,2),
ADD COLUMN     "infantCost" DECIMAL(10,2),
ADD COLUMN     "parkingProvisionSlug" TEXT,
ADD COLUMN     "terrainTypeSlug" TEXT,
ADD COLUMN     "venueSettingSlug" TEXT;

-- CreateTable
CREATE TABLE "opportunity_terrain_types" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_terrain_types_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_terrain_types_label_key" ON "opportunity_terrain_types"("label");

-- AddForeignKey
ALTER TABLE "opportunity_venues" ADD CONSTRAINT "opportunity_venues_terrainTypeSlug_fkey" FOREIGN KEY ("terrainTypeSlug") REFERENCES "opportunity_terrain_types"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_venues" ADD CONSTRAINT "opportunity_venues_venueSettingSlug_fkey" FOREIGN KEY ("venueSettingSlug") REFERENCES "opportunity_venue_settings"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_venues" ADD CONSTRAINT "opportunity_venues_parkingProvisionSlug_fkey" FOREIGN KEY ("parkingProvisionSlug") REFERENCES "opportunity_parking_provisions"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
