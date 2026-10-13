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

export const forgotPasswordSchema = yup.object({
  email: yup.string().trim().email('Invalid email').required('Email is required'),
}).required();

export const resetPasswordSchema = yup.object({
  email:       yup.string().trim().email('Invalid email').required('Email is required'),
  code:        yup.string().trim().matches(/^\d{6}$/, 'Code must be 6 digits').required('Code is required'),
  // Mirrors COGNITO_PASSWORD_POLICY (cdk/lib/config/cognito-config.ts); Cognito re-checks it anyway.
  newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
}).required();
