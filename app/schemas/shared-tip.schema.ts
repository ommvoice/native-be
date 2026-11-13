import * as yup from 'yup';
import { SHARED_TIP_KINDS, SHARED_TIP_PHOTO_TYPES, SHARED_TIP_WORKS_FOR } from '../dtos/shared-tip.dto';

const rating = yup.number().integer().min(1, 'ratings are 1-5').max(5, 'ratings are 1-5');

export const createSharedTipPhotoUploadUrlSchema = yup.object({
  contentType: yup.string().oneOf([...SHARED_TIP_PHOTO_TYPES], `contentType must be one of ${SHARED_TIP_PHOTO_TYPES.join(', ')}`)
    .required('contentType is required'),
}).required();

export const createSharedTipSchema = yup.object({
  kind:            yup.string().oneOf(SHARED_TIP_KINDS).required('kind is required'),
  placeName:       yup.string().trim().max(80, 'placeName must be at most 80 characters').required('placeName is required'),
  tip:             yup.string().trim().max(500, 'tip must be at most 500 characters').required('tip is required'),
  bring:           yup.string().trim().max(200, 'bring must be at most 200 characters').nullable(),
  photoKey:        yup.string().max(300).nullable(),
  opportunityId:   yup.string().nullable(),
  opportunityType: yup.string().oneOf([...SHARED_TIP_KINDS]).nullable()
    .when('opportunityId', {
      is: (v: unknown) => !!v,
      then: (s) => s.required('opportunityType is required with opportunityId'),
    }),
  worksFor:        yup.array(yup.string().oneOf([...SHARED_TIP_WORKS_FOR]).required()).max(SHARED_TIP_WORKS_FOR.length).default([]),
  ratings:         yup.object({
    kidsEnjoyed:    rating,
    easyToManage:   rating,
    worthTheEffort: rating,
  }).default({}),
}).required();
