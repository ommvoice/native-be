import { BRAND, renderEmailLayout } from './layout';

/** Cognito's ForgotPassword codes are valid for 1 hour — fixed by Cognito, not configurable. */
const CODE_VALIDITY_TEXT = '1 hour';

/**
 * Password-reset email. `code` is whatever Cognito hands the CustomMessage trigger as
 * `codeParameter` (the literal placeholder "{####}") — Cognito swaps in the real code after the
 * trigger returns, and rejects the message if the placeholder is missing.
 */
export function renderResetPasswordEmail(code: string): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:bold;">Reset your password</p>
    <p style="margin:0 0 24px;">Enter this code in the ${BRAND.name} app to choose a new password:</p>
    <p style="margin:0 0 24px;text-align:center;">
      <span style="display:inline-block;padding:14px 24px;background:${BRAND.surface};border:1px solid ${BRAND.green};border-radius:8px;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;letter-spacing:8px;color:${BRAND.greenDark};">${code}</span>
    </p>
    <p style="margin:0 0 16px;color:${BRAND.muted};">This code expires in ${CODE_VALIDITY_TEXT}.</p>
    <p style="margin:0;color:${BRAND.muted};">Didn't ask to reset your password? You can safely ignore this email — your password won't change.</p>`;

  return {
    subject: `Your ${BRAND.name} password reset code`,
    html:    renderEmailLayout({ preheader: 'Your password reset code is inside.', body }),
  };
}
