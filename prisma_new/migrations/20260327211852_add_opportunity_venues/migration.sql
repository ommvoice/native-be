-- CreateTable
CREATE TABLE "opportunity_venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "themeSlug" TEXT NOT NULL,
    "themeVariantSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_venues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_venues_themeSlug_idx" ON "opportunity_venues"("themeSlug");

-- AddForeignKey
ALTER TABLE "opportunity_venues" ADD CONSTRAINT "opportunity_venues_themeSlug_fkey" FOREIGN KEY ("themeSlug") REFERENCES "opportunity_themes"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_venues" ADD CONSTRAINT "opportunity_venues_themeVariantSlug_fkey" FOREIGN KEY ("themeVariantSlug") REFERENCES "opportunity_theme_variants"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
