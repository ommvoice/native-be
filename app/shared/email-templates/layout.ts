/**
 * Shared HTML shell for every transactional email (password reset now, signup codes later).
 * Email-client safe: table layout, inline styles only, no external CSS/fonts/images.
 */

export const BRAND = {
  name:      'Native Family',
  green:     '#47D1A3',
  greenDark: '#2FA982',
  text:      '#1F2933',
  muted:     '#6B7280',
  surface:   '#F5F7F6',
} as const;

export interface EmailLayoutOptions {
  /** Hidden inbox-preview text shown next to the subject line. */
  preheader: string;
  /** Inner HTML, rendered inside the white card. */
  body: string;
}

export function renderEmailLayout({ preheader, body }: EmailLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr>
          <td style="background:${BRAND.green};border-radius:12px 12px 0 0;padding:24px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">
            ${BRAND.name}
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:${BRAND.text};">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};">
            You're receiving this because of activity on your ${BRAND.name} account.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
