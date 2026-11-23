import * as yup from 'yup';

const stringArray = () =>
  yup
    .mixed()
    .transform((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v))
    .default([]);

export const opportunitySearchQuerySchema = yup.object({
  parentId:                yup.string().optional(), // ignored: derived from the auth token (must match if sent)
  childId:                 yup.string(),
  interestSubCategorySlug: yup.string(),
  facility: yup
    .mixed()
    .transform((v) => (typeof v === 'string' ? [v] : v))
    .default([]),
  maxDistanceMiles:      yup.number().positive(),
  maxTimeToReachMinutes: yup.number().positive(),

  // ── Extended filters — matches native-fe-v0's FilterState ────────────────
  themeSlug:           yup.string(),
  themeVariantSlug:    stringArray(),
  routeDifficulty:     stringArray(),
  routeType:           stringArray(),
  routeMaxLengthMiles: yup.number().positive(),
  routeSuitability:    stringArray(),
  attractions:         stringArray(),
  skipRecommendations: stringArray(),
}).required();
