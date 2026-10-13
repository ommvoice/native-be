import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { renderResetPasswordEmail } from '../../shared/email-templates/reset-password';

/**
 * Cognito CustomMessage trigger — swaps Cognito's plain-text emails for our HTML templates.
 * Cognito then sends the result through SES (see CognitoStack's `email` config).
 *
 * Wired directly on the user pool (CognitoStack), not through the lambda registry: it's invoked by
 * Cognito, not API Gateway, and has no third-party imports so it doesn't need the shared layer.
 *
 * Only ForgotPassword is customised for now. Every other trigger source is returned untouched so
 * Cognito falls back to its default message — add CustomMessage_SignUp / _ResendCode /
 * _VerifyUserAttribute cases here when the signup verification-code email is built.
 */
export const handler = async (event: CustomMessageTriggerEvent): Promise<CustomMessageTriggerEvent> => {
  switch (event.triggerSource) {
    case 'CustomMessage_ForgotPassword': {
      const { subject, html } = renderResetPasswordEmail(event.request.codeParameter);
      event.response.emailSubject = subject;
      event.response.emailMessage = html;
      break;
    }
    default:
      break;
  }
  return event;
};
