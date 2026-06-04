import * as yup from 'yup';

export const onboardParentSchema = yup.object({
  email:               yup.string().email().required('email is required'),
  password:            yup.string().min(8).required('password is required'),
  firstNameOrNickName: yup.string().required('firstNameOrNickName is required'),
  postCode:            yup.string().required('postCode is required'),
  searchRadius:        yup.number().min(1).max(200).required('searchRadius is required'),
  children: yup.array(
    yup.object({
      nameOrNickName: yup.string().required(),
      dateOfBirth:    yup.string().required(),
    }).required(),
  ).min(1).required('At least one child is required'),
}).required();
