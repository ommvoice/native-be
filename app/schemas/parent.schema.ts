import * as yup from 'yup';
import { idString, slugArray } from './limits';

export const updateSearchRadiusSchema = yup.object({
  searchRadius: yup.number().min(1).max(200).required('searchRadius is required'),
}).required();

export const updateParentBaseSchema = yup.object({
  baseId:        idString().required('baseId is required'),
  serviceBranch: yup.string().oneOf(['army', 'raf', 'navy']).required('serviceBranch is required'),
}).required();

export const updateParentInterestsSchema = yup.object({
  interestCategoryIds:    slugArray().required().default([]),
  interestSubCategoryIds: slugArray().required().default([]),
}).required();
