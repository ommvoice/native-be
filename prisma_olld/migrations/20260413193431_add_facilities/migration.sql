-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('GENERAL', 'PARENT', 'KID', 'DOG');

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "type" "FacilityType" NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilities_slug_key" ON "facilities"("slug");

-- CreateIndex
CREATE INDEX "facilities_type_idx" ON "facilities"("type");
