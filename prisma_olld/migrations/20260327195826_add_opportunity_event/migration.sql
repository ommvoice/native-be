-- CreateEnum
CREATE TYPE "OPPORTUNITY_THEME" AS ENUM ('A_BIG_DAY_OUT', 'SCENIC_WALKS_AND_WONDERS', 'GREEN_SPACES_TO_RUN_AROUND');

-- CreateEnum
CREATE TYPE "OPPORTUNITY_THEME_VARIANT" AS ENUM ('SEASONAL_AND_THEMED_EVENTS', 'AMUSEMENT_PARK');

-- CreateEnum
CREATE TYPE "EVENT_TYPE" AS ENUM ('SOCIAL_GATHERING', 'SHARED_MEAL', 'WORKSHOP_OR_TALK', 'CRAFTY_MAKING', 'FESTIVE', 'FORMAL_EVENT', 'COUNTRY_SHOW', 'FESTIVAL', 'NATURE_BASED', 'MUSIC', 'PERFORMANCE', 'ENTERTAINMENT', 'SPORT_BASED', 'FAMILY_FUN_DAY');

-- CreateTable
CREATE TABLE "opportunity_events" (
    "id" TEXT NOT NULL,
    "opportunityTheme" "OPPORTUNITY_THEME" NOT NULL,
    "opportunityThemeVariant" "OPPORTUNITY_THEME_VARIANT",
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "EVENT_TYPE" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_events_eventType_idx" ON "opportunity_events"("eventType");

-- CreateIndex
CREATE INDEX "opportunity_events_opportunityTheme_idx" ON "opportunity_events"("opportunityTheme");
