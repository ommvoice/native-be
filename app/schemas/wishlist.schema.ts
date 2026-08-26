import * as yup from 'yup';

export const createWishlistSchema = yup.object({
  name:     yup.string().required('name is required'),
  color:    yup.string().required('color is required'),
  parentId: yup.string().required('parentId is required'),
  childId:  yup.string().required('childId is required'),
}).required();

export const getWishlistsQuerySchema = yup.object({
  parentId: yup.string().required('parentId is required'),
}).required();

export const addWishlistItemSchema = yup.object({
  opportunityId:   yup.string().required('opportunityId is required'),
  opportunityType: yup.string().oneOf(['venue', 'event', 'club', 'route']).required('opportunityType is required'),
}).required();
