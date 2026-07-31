import * as yup from 'yup';

export const registerSchema = yup.object({
  email:    yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
}).required();

export const loginSchema = yup.object({
  email:    yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
}).required();

export const refreshSchema = yup.object({
  refreshToken: yup.string().required('Refresh token is required'),
}).required();
