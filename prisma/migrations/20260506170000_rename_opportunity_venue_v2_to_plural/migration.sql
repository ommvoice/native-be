-- Plural table name (matches Prisma @@map("opportunity_venues_v2")).

ALTER TABLE "opportunity_venue_v2" RENAME TO "opportunity_venues_v2";

ALTER TABLE "opportunity_venues_v2" RENAME CONSTRAINT "opportunity_venue_v2_pkey" TO "opportunity_venues_v2_pkey";

ALTER INDEX "opportunity_venue_v2_venue_opportunity_theme_id_idx" RENAME TO "opportunity_venues_v2_venue_opportunity_theme_id_idx";

ALTER INDEX "opportunity_venue_v2_venue_opportunity_theme_variant_id_idx" RENAME TO "opportunity_venues_v2_venue_opportunity_theme_variant_id_idx";

ALTER TABLE "opportunity_venues_v2" RENAME CONSTRAINT "opportunity_venue_v2_venue_opportunity_theme_id_fkey" TO "opportunity_venues_v2_venue_opportunity_theme_id_fkey";

ALTER TABLE "opportunity_venues_v2" RENAME CONSTRAINT "opportunity_venue_v2_venue_opportunity_theme_variant_id_fkey" TO "opportunity_venues_v2_venue_opportunity_theme_variant_id_fkey";
