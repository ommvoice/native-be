-- CreateEnum
CREATE TYPE "OpportunityRecordType" AS ENUM ('venue', 'event', 'club', 'route');

-- AlterTable
ALTER TABLE "opportunity_venues" ADD COLUMN "type" "OpportunityRecordType" NOT NULL DEFAULT 'venue';

-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN "type" "OpportunityRecordType" NOT NULL DEFAULT 'event';

-- AlterTable
ALTER TABLE "opportunity_clubs" ADD COLUMN "type" "OpportunityRecordType" NOT NULL DEFAULT 'club';

-- AlterTable
ALTER TABLE "opportunity_routes" ADD COLUMN "type" "OpportunityRecordType" NOT NULL DEFAULT 'route';
