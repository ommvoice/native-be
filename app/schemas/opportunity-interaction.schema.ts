import * as yup from 'yup';

export const setOpportunityInteractionSchema = yup.object({
  parentId:        yup.string().required('parentId is required'),
  opportunityId:   yup.string().required('opportunityId is required'),
  opportunityType: yup.string().oneOf(['venue', 'event', 'club', 'route']).required('opportunityType is required'),
  interactionType: yup.string().oneOf(['visited', 'not_interested']).required('interactionType is required'),
  starRating:      yup.number().min(1).max(5).optional(),
}).required();

export const getOpportunityInteractionsQuerySchema = yup.object({
  parentId:        yup.string().required('parentId is required'),
  interactionType: yup.string().oneOf(['visited', 'not_interested']).optional(),
}).required();
