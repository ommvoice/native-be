-- AlterTable
ALTER TABLE "opportunity_venues" ADD COLUMN     "dogFacilitySlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
