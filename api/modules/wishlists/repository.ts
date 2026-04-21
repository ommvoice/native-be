import prisma from "../../database/database.config.js";

const wishlistItemInclude = {
  opportunityVenue: true,
  opportunityEvent: true,
  opportunityClub: true,
  opportunityRoute: true,
} as const;

const wishlistInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: wishlistItemInclude,
  },
} as const;

export class WishlistRepository {
  async findByParentId(parentId: string, childId?: string) {
    return prisma.wishlist.findMany({
      where: {
        parentId,
        ...(childId ? { childId } : {}),
      },
      include: wishlistInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    parentId: string;
    childId: string;
    name: string;
    color: string;
    items: Array<{
      opportunityVenueId?: string;
      opportunityEventId?: string;
      opportunityClubId?: string;
      opportunityRouteId?: string;
    }>;
  }) {
    return prisma.wishlist.create({
      data: {
        parentId: data.parentId,
        childId: data.childId,
        name: data.name,
        color: data.color,
        items: {
          create: data.items.map((item) => {
            if (item.opportunityVenueId) {
              return { opportunityVenueId: item.opportunityVenueId };
            }
            if (item.opportunityEventId) {
              return { opportunityEventId: item.opportunityEventId };
            }
            if (item.opportunityClubId) {
              return { opportunityClubId: item.opportunityClubId };
            }
            if (item.opportunityRouteId) {
              return { opportunityRouteId: item.opportunityRouteId };
            }
            throw new Error("Wishlist item must reference exactly one opportunity");
          }),
        },
      },
      include: wishlistInclude,
    });
  }

  async opportunityIdsExist(items: {
    venueIds: string[];
    eventIds: string[];
    clubIds: string[];
    routeIds: string[];
  }) {
    const checks: Promise<boolean>[] = [];

    if (items.venueIds.length > 0) {
      const unique = [...new Set(items.venueIds)];
      checks.push(
        prisma.opportunityVenue
          .count({ where: { id: { in: unique } } })
          .then((n) => n === unique.length),
      );
    }
    if (items.eventIds.length > 0) {
      const unique = [...new Set(items.eventIds)];
      checks.push(
        prisma.opportunityEvent
          .count({ where: { id: { in: unique } } })
          .then((n) => n === unique.length),
      );
    }
    if (items.clubIds.length > 0) {
      const unique = [...new Set(items.clubIds)];
      checks.push(
        prisma.opportunityClub
          .count({ where: { id: { in: unique } } })
          .then((n) => n === unique.length),
      );
    }
    if (items.routeIds.length > 0) {
      const unique = [...new Set(items.routeIds)];
      checks.push(
        prisma.opportunityRoute
          .count({ where: { id: { in: unique } } })
          .then((n) => n === unique.length),
      );
    }

    const results = await Promise.all(checks);
    return results.every(Boolean);
  }

  async parentExists(id: string) {
    const row = await prisma.parents.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!row;
  }

  async childBelongsToParent(childId: string, parentId: string) {
    const row = await prisma.children.findFirst({
      where: { id: childId, parentId },
      select: { id: true },
    });
    return !!row;
  }
}
