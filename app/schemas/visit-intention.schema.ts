import * as yup from 'yup';
import { idString } from './limits';

export const setVisitIntentionSchema = yup.object({
  parentId:        yup.string().optional(), // ignored: derived from the auth token (must match if sent)
  opportunityId:   idString().required('opportunityId is required'),
  opportunityType: yup.string().oneOf(['venue', 'event', 'club', 'route']).required('opportunityType is required'),
  timeframe:       yup.string().max(50).required('timeframe is required'),
}).required();

export const getVisitIntentionsQuerySchema = yup.object({
  parentId: yup.string().optional(), // ignored: derived from the auth token (must match if sent)
}).required();
