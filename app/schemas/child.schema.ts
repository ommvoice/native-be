import * as yup from 'yup';

export const createChildSchema = yup.object({
  parentId:               yup.string().required('parentId is required'),
  nameOrNickName:         yup.string().required('nameOrNickName is required'),
  dateOfBirth:            yup.string().required('dateOfBirth is required'),
  skillIds:               yup.array(yup.string().required()).default([]),
  interestCategoryIds:    yup.array(yup.string().required()).default([]),
  interestSubCategoryIds: yup.array(yup.string().required()).default([]),
}).required();

export const updateChildSchema = yup.object({
  nameOrNickName: yup.string(),
  dateOfBirth:    yup.string(),
  skillIds:       yup.array(yup.string().required()),
}).required();

export const updateChildInterestsSchema = yup.object({
  interestCategoryIds:    yup.array(yup.string().required()).required().default([]),
  interestSubCategoryIds: yup.array(yup.string().required()).required().default([]),
}).required();
