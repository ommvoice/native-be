import * as yup from 'yup';
import type { PersonVariant } from '../repositories/child.repository';
import { dateOfBirthString, nameString, slugArray } from './limits';

export const createChildSchema = yup.object({
  parentId:               yup.string().optional(), // ignored: derived from the auth token (must match if sent)
  nameOrNickName:         nameString().required('nameOrNickName is required'),
  dateOfBirth:            dateOfBirthString().required('dateOfBirth is required'),
  // Only 'child' | 'adult' are client-settable — 'guest' is set by POST /children/guest (with its
  // expireDate), 'parent' is never a child row.
  variant:                yup.mixed<PersonVariant>().oneOf(['child', 'adult'], 'variant must be child or adult').default('child'),
  skillIds:               slugArray().default([]),
  interestCategoryIds:    slugArray().default([]),
  interestSubCategoryIds: slugArray().default([]),
  interestTags:           slugArray().default([]),
}).required();

// POST /children/guest — the service always stores variant: 'guest', so any client-sent variant is
// stripped rather than validated (the app's GuestForm sends 'guest', which createChildSchema rejects).
export const createGuestChildSchema = createChildSchema.omit(['variant']);

export const updateChildSchema = yup.object({
  nameOrNickName: nameString(),
  dateOfBirth:    dateOfBirthString(),
  skillIds:       slugArray(),
}).required();

export const updateChildInterestsSchema = yup.object({
  interestCategoryIds:    slugArray().required().default([]),
  interestSubCategoryIds: slugArray().required().default([]),
}).required();

export const updateChildInterestTagsSchema = yup.object({
  interestTags: slugArray().required().default([]),
}).required();
