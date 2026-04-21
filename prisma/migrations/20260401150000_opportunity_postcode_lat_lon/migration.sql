-- AlterTable
ALTER TABLE "opportunity_venues" ADD COLUMN "postCode" VARCHAR(20),
ADD COLUMN "latitude" TEXT,
ADD COLUMN "longitude" TEXT;

-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN "postCode" VARCHAR(20),
ADD COLUMN "latitude" TEXT,
ADD COLUMN "longitude" TEXT;

-- AlterTable
ALTER TABLE "opportunity_clubs" ADD COLUMN "postCode" VARCHAR(20),
ADD COLUMN "latitude" TEXT,
ADD COLUMN "longitude" TEXT;

-- AlterTable
ALTER TABLE "opportunity_routes" ADD COLUMN "postCode" VARCHAR(20),
ADD COLUMN "latitude" TEXT,
ADD COLUMN "longitude" TEXT;
