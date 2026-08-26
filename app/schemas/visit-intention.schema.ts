import * as yup from 'yup';

export const setVisitIntentionSchema = yup.object({
  parentId:        yup.string().required('parentId is required'),
  opportunityId:   yup.string().required('opportunityId is required'),
  opportunityType: yup.string().oneOf(['venue', 'event', 'club', 'route']).required('opportunityType is required'),
  timeframe:       yup.string().required('timeframe is required'),
}).required();

export const getVisitIntentionsQuerySchema = yup.object({
  parentId: yup.string().required('parentId is required'),
}).required();
