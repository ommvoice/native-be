-- Theme and theme-variant catalog (per opportunity record type). Slugs on venue/event/club/route rows remain app-managed until wired to these tables.

CREATE TABLE "opportunity_theme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recordType" "OpportunityRecordType" NOT NULL,
    "optionGroupSlug" TEXT NOT NULL,
    "optionGroupLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_theme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "opportunity_theme_recordType_slug_key" ON "opportunity_theme"("recordType", "slug");

CREATE INDEX "opportunity_theme_recordType_optionGroupSlug_idx" ON "opportunity_theme"("recordType", "optionGroupSlug");

CREATE TABLE "opportunity_theme_variant" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicableTypes" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_theme_variant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "opportunity_theme_variant_themeId_slug_key" ON "opportunity_theme_variant"("themeId", "slug");

CREATE INDEX "opportunity_theme_variant_themeId_idx" ON "opportunity_theme_variant"("themeId");

ALTER TABLE "opportunity_theme_variant" ADD CONSTRAINT "opportunity_theme_variant_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "opportunity_theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
