import * as yup from 'yup';
import { idString, nameString } from './limits';

export const createWishlistSchema = yup.object({
  name:     nameString().required('name is required'),
  color:    yup.string().max(20).required('color is required'),
  parentId: yup.string().optional(), // ignored: derived from the auth token (must match if sent)
  childId:  idString().required('childId is required'),
}).required();

export const getWishlistsQuerySchema = yup.object({
  parentId: yup.string().optional(), // ignored: derived from the auth token (must match if sent)
}).required();

export const addWishlistItemSchema = yup.object({
  opportunityId:   idString().required('opportunityId is required'),
  opportunityType: yup.string().oneOf(['venue', 'event', 'club', 'route']).required('opportunityType is required'),
}).required();
