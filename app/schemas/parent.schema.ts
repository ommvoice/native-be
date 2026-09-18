import * as yup from 'yup';

export const updateSearchRadiusSchema = yup.object({
  searchRadius: yup.number().min(1).max(200).required('searchRadius is required'),
}).required();

export const updateParentBaseSchema = yup.object({
  baseId:        yup.string().required('baseId is required'),
  serviceBranch: yup.string().oneOf(['army', 'raf', 'navy']).required('serviceBranch is required'),
}).required();

export const updateParentInterestsSchema = yup.object({
  interestCategoryIds:    yup.array(yup.string().required()).required().default([]),
  interestSubCategoryIds: yup.array(yup.string().required()).required().default([]),
}).required();
