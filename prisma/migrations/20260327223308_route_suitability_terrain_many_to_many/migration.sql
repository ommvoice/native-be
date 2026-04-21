/*
  Warnings:

  - You are about to drop the column `routeSuitabilitySlug` on the `opportunity_routes` table. All the data in the column will be lost.
  - You are about to drop the column `terrainTypeSlug` on the `opportunity_routes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "opportunity_routes" DROP CONSTRAINT "opportunity_routes_routeSuitabilitySlug_fkey";

-- DropForeignKey
ALTER TABLE "opportunity_routes" DROP CONSTRAINT "opportunity_routes_terrainTypeSlug_fkey";

-- AlterTable
ALTER TABLE "opportunity_routes" DROP COLUMN "routeSuitabilitySlug",
DROP COLUMN "terrainTypeSlug";

-- CreateTable
CREATE TABLE "_OpportunityRouteToRouteSuitability" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityRouteToRouteSuitability_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityRouteToTerrainType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityRouteToTerrainType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OpportunityRouteToRouteSuitability_B_index" ON "_OpportunityRouteToRouteSuitability"("B");

-- CreateIndex
CREATE INDEX "_OpportunityRouteToTerrainType_B_index" ON "_OpportunityRouteToTerrainType"("B");

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToRouteSuitability" ADD CONSTRAINT "_OpportunityRouteToRouteSuitability_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToRouteSuitability" ADD CONSTRAINT "_OpportunityRouteToRouteSuitability_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_route_suitabilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToTerrainType" ADD CONSTRAINT "_OpportunityRouteToTerrainType_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityRouteToTerrainType" ADD CONSTRAINT "_OpportunityRouteToTerrainType_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_terrain_types"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
