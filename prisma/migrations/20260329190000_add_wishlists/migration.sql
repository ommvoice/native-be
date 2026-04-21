-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "opportunityVenueId" TEXT,
    "opportunityEventId" TEXT,
    "opportunityClubId" TEXT,
    "opportunityRouteId" TEXT,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlists_parentId_idx" ON "wishlists"("parentId");

-- CreateIndex
CREATE INDEX "wishlists_childId_idx" ON "wishlists"("childId");

-- CreateIndex
CREATE INDEX "wishlist_items_wishlistId_idx" ON "wishlist_items"("wishlistId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlistId_opportunityVenueId_key" ON "wishlist_items"("wishlistId", "opportunityVenueId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlistId_opportunityEventId_key" ON "wishlist_items"("wishlistId", "opportunityEventId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlistId_opportunityClubId_key" ON "wishlist_items"("wishlistId", "opportunityClubId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlistId_opportunityRouteId_key" ON "wishlist_items"("wishlistId", "opportunityRouteId");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_opportunityVenueId_fkey" FOREIGN KEY ("opportunityVenueId") REFERENCES "opportunity_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_opportunityEventId_fkey" FOREIGN KEY ("opportunityEventId") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_opportunityClubId_fkey" FOREIGN KEY ("opportunityClubId") REFERENCES "opportunity_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_opportunityRouteId_fkey" FOREIGN KEY ("opportunityRouteId") REFERENCES "opportunity_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
