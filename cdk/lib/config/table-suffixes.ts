/** Single source of truth for DynamoDB table name suffixes.
 *  Table names are built as: {appName}-{env}-{suffix}
 *  Imported by both CDK (app-config.ts) and seed scripts (seed/config/db.ts).
 */
export const TABLE_SUFFIXES = {
  users:                    'users',
  parents:                  'parents',
  children:                 'children',
  drivingLegs:              'driving-legs',
  wishlists:                'wishlists',
  wishlistItems:            'wishlist-items',
} as const;

export type TableKey = keyof typeof TABLE_SUFFIXES;
