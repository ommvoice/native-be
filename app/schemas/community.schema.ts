import * as yup from 'yup';

export const getCommunityHubQuerySchema = yup.object({
  parentId: yup.string().required('parentId is required'),
}).required();
