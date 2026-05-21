-- AlterTable
ALTER TABLE "opportunity_event_types" RENAME CONSTRAINT "event_types_pkey" TO "opportunity_event_types_pkey";

-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN     "activityGroupSlug" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "finishTime" VARCHAR(5),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "startTime" VARCHAR(5),
ADD COLUMN     "venuePostCode" VARCHAR(10);

-- CreateTable
CREATE TABLE "opportunity_activity_groups" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_activity_groups_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_activity_groups_label_key" ON "opportunity_activity_groups"("label");

-- CreateIndex
CREATE INDEX "opportunity_events_activityGroupSlug_idx" ON "opportunity_events"("activityGroupSlug");

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_activityGroupSlug_fkey" FOREIGN KEY ("activityGroupSlug") REFERENCES "opportunity_activity_groups"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "event_types_label_key" RENAME TO "opportunity_event_types_label_key";
