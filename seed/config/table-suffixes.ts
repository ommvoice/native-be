/** Single source of truth for DynamoDB table name suffixes.
 *  Table names are built as: {appName}-{env}-{suffix}
 *  Imported by both CDK (app-config.ts) and seed scripts (seed/config/db.ts).
 */
export const TABLE_SUFFIXES = {
  users:                    'users',
  parents:                  'parents',
  children:                 'children',
  interestCategories:       'interest-categories',
  skills:                   'skills',
  skillLevels:              'skill-levels',
  facilities:               'facilities',
  opportunityVenues:        'opportunity-venues',
  opportunityEvents:        'opportunity-events',
  opportunityClubs:         'opportunity-clubs',
  opportunityRoutes:        'opportunity-routes',
  drivingLegs:              'driving-legs',
  wishlists:                'wishlists',
  wishlistItems:            'wishlist-items',
  opportunityClubsV2:       'opportunity-clubs-v2',
  opportunityEventsV2:      'opportunity-events-v2',
  opportunityVenuesV2:      'opportunity-venues-v2',
  opportunityRoutesV2:      'opportunity-routes-v2',
  opportunityThemes:        'opportunity-themes',
  opportunityThemeVariants: 'opportunity-theme-variants',
} as const;

export type TableKey = keyof typeof TABLE_SUFFIXES;
