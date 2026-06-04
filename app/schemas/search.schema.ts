import * as yup from 'yup';

export const opportunitySearchQuerySchema = yup.object({
  parentId:                yup.string().required('parentId is required'),
  childId:                 yup.string(),
  interestSubCategorySlug: yup.string(),
  facility: yup
    .mixed()
    .transform((v) => (typeof v === 'string' ? [v] : v))
    .default([]),
  maxDistanceMiles:      yup.number().positive(),
  maxTimeToReachMinutes: yup.number().positive(),
}).required();
