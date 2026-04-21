-- CreateTable
CREATE TABLE "parent_opportunity_driving_legs" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "opportunityType" "OpportunityRecordType" NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "parentPostCode" VARCHAR(20) NOT NULL,
    "parentLatitude" TEXT NOT NULL,
    "parentLongitude" TEXT NOT NULL,
    "opportunityPostCode" VARCHAR(20),
    "opportunityLatitude" TEXT NOT NULL,
    "opportunityLongitude" TEXT NOT NULL,
    "drivingDistanceMeters" INTEGER NOT NULL,
    "drivingDurationSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_opportunity_driving_legs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_opportunity_driving_legs_parentId_opportunityType_opportunityId_key" ON "parent_opportunity_driving_legs"("parentId", "opportunityType", "opportunityId");

-- CreateIndex
CREATE INDEX "parent_opportunity_driving_legs_parentId_idx" ON "parent_opportunity_driving_legs"("parentId");

-- AddForeignKey
ALTER TABLE "parent_opportunity_driving_legs" ADD CONSTRAINT "parent_opportunity_driving_legs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
