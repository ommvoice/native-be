import * as yup from 'yup';
import { PersonVariant } from '../repositories/child.repository';

export const createChildSchema = yup.object({
  parentId:               yup.string().required('parentId is required'),
  nameOrNickName:         yup.string().required('nameOrNickName is required'),
  dateOfBirth:            yup.string().required('dateOfBirth is required'),
  // Only 'child' | 'adult' are client-settable — 'guest' is set by POST /children/guest (with its
  // expireDate), 'parent' is never a child row.
  variant:                yup.mixed<PersonVariant>().oneOf(["guest" , "parent" , "child" , "adult"], 'variant must be child or adult or guest').default('child'),
  skillIds:               yup.array(yup.string().required()).default([]),
  interestCategoryIds:    yup.array(yup.string().required()).default([]),
  interestSubCategoryIds: yup.array(yup.string().required()).default([]),
  interestTags:           yup.array(yup.string().required()).default([]),
}).required();

// POST /children/guest — the service always stores variant: 'guest', so any client-sent variant is
// stripped rather than validated (the app's GuestForm sends 'guest', which createChildSchema rejects).
export const createGuestChildSchema = createChildSchema.omit(['variant']);

export const updateChildSchema = yup.object({
  nameOrNickName: yup.string(),
  dateOfBirth:    yup.string(),
  skillIds:       yup.array(yup.string().required()),
}).required();

export const updateChildInterestsSchema = yup.object({
  interestCategoryIds:    yup.array(yup.string().required()).required().default([]),
  interestSubCategoryIds: yup.array(yup.string().required()).required().default([]),
}).required();

export const updateChildInterestTagsSchema = yup.object({
  interestTags: yup.array(yup.string().required()).required().default([]),
}).required();
