import * as yup from 'yup';
import { idString } from './limits';

export const setOpportunityInteractionSchema = yup.object({
  parentId:        yup.string().optional(), // ignored: derived from the auth token (must match if sent)
  opportunityId:   idString().required('opportunityId is required'),
  opportunityType: yup.string().oneOf(['venue', 'event', 'club', 'route']).required('opportunityType is required'),
  interactionType: yup.string().oneOf(['visited', 'not_interested']).required('interactionType is required'),
  starRating:      yup.number().min(1).max(5).optional(),
}).required();

export const getOpportunityInteractionsQuerySchema = yup.object({
  parentId:        yup.string().optional(), // ignored: derived from the auth token (must match if sent)
  interactionType: yup.string().oneOf(['visited', 'not_interested']).optional(),
}).required();
