import * as yup from 'yup';
import { emailString } from './limits';

// Mirrors COGNITO_PASSWORD_POLICY (cdk/lib/config/cognito-config.ts); Cognito re-checks it anyway.
export const newPasswordRule = () =>
  yup.string().min(12, 'Password must be at least 12 characters').max(256).matches(/[A-Z]/, 'Password must contain an uppercase letter').matches(/[0-9]/, 'Password must contain a number').matches(/[^A-Za-z0-9]/, 'Password must contain a symbol');

export const registerSchema = yup.object({
  email:    emailString().required('Email is required'),
  password: newPasswordRule().required('Password is required'),
}).required();

export const loginSchema = yup.object({
  email:    emailString().required('Email is required'),
  password: yup.string().max(256).required('Password is required'),
}).required();

export const refreshSchema = yup.object({
  refreshToken: yup.string().max(8192).required('Refresh token is required'),
}).required();

export const forgotPasswordSchema = yup.object({
  email: emailString().required('Email is required'),
}).required();

export const resetPasswordSchema = yup.object({
  email:       emailString().required('Email is required'),
  code:        yup.string().trim().matches(/^\d{6}$/, 'Code must be 6 digits').required('Code is required'),
  // Mirrors COGNITO_PASSWORD_POLICY (cdk/lib/config/cognito-config.ts); Cognito re-checks it anyway.
  newPassword: newPasswordRule().required('New password is required'),
}).required();
