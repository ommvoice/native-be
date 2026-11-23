import * as yup from 'yup';
import { newPasswordRule } from './auth.schema';
import { dateOfBirthString, emailString, nameString, postCodeString } from './limits';

export const onboardParentSchema = yup.object({
  email:               emailString().required('email is required'),
  password:            newPasswordRule().required('password is required'),
  firstNameOrNickName: nameString().required('firstNameOrNickName is required'),
  postCode:            postCodeString().required('postCode is required'),
  searchRadius:        yup.number().min(1).max(200).optional(),
  children: yup.array(
    yup.object({
      nameOrNickName: nameString().required(),
      dateOfBirth:    dateOfBirthString().required(),
    }).required(),
  ).min(1).max(10, 'At most 10 children').required('At least one child is required'),
}).required();
