/*
  Warnings:

  - You are about to drop the column `eventType` on the `opportunity_events` table. All the data in the column will be lost.
  - You are about to drop the column `opportunityTheme` on the `opportunity_events` table. All the data in the column will be lost.
  - You are about to drop the column `opportunityThemeVariant` on the `opportunity_events` table. All the data in the column will be lost.
  - Added the required column `eventTypeSlug` to the `opportunity_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `themeSlug` to the `opportunity_events` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "opportunity_events_eventType_idx";

-- DropIndex
DROP INDEX "opportunity_events_opportunityTheme_idx";

-- AlterTable
ALTER TABLE "opportunity_events" DROP COLUMN "eventType",
DROP COLUMN "opportunityTheme",
DROP COLUMN "opportunityThemeVariant",
ADD COLUMN     "eventTypeSlug" TEXT NOT NULL,
ADD COLUMN     "themeSlug" TEXT NOT NULL,
ADD COLUMN     "themeVariantSlug" TEXT;

-- DropEnum
DROP TYPE "EVENT_TYPE";

-- DropEnum
DROP TYPE "OPPORTUNITY_THEME";

-- DropEnum
DROP TYPE "OPPORTUNITY_THEME_VARIANT";

-- CreateTable
CREATE TABLE "opportunity_themes" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_themes_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_theme_variants" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_theme_variants_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "event_types" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_themes_label_key" ON "opportunity_themes"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_theme_variants_label_key" ON "opportunity_theme_variants"("label");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_label_key" ON "event_types"("label");

-- CreateIndex
CREATE INDEX "opportunity_events_themeSlug_idx" ON "opportunity_events"("themeSlug");

-- CreateIndex
CREATE INDEX "opportunity_events_eventTypeSlug_idx" ON "opportunity_events"("eventTypeSlug");

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_themeSlug_fkey" FOREIGN KEY ("themeSlug") REFERENCES "opportunity_themes"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_themeVariantSlug_fkey" FOREIGN KEY ("themeVariantSlug") REFERENCES "opportunity_theme_variants"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_eventTypeSlug_fkey" FOREIGN KEY ("eventTypeSlug") REFERENCES "event_types"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
