import * as yup from 'yup';

export const getCommunityHubQuerySchema = yup.object({
  parentId: yup.string().optional(), // ignored: derived from the auth token (must match if sent)
}).required();
