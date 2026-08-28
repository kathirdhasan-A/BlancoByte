/**
 * Branded HTML email templates that match the BlancoByte website fonts and colors.
 *
 * Email clients are constrained: web fonts rarely load (so we provide robust
 * fallbacks), <style> blocks and classes are often stripped (so everything is
 * inline), and layout must use tables (for Outlook). The brand accent and dark
 * palette are reproduced with inline styles so the look survives across clients.
 */

const BRAND = {
  accent: "#2E6BF5",
  accentSoft: "rgba(46, 107, 245, 0.16)",
  canvas: "#0A1735",
  card: "#13224A",
  elevated: "#1A2C5C",
  border: "#24345F",
  textPrimary: "#EAF1FF",
  textSecondary: "#BCC9E8",
  textMuted: "#8697BE",
  // Web fonts won't load in most clients; the first name is used where available
  // (e.g. Apple Mail), otherwise it falls back gracefully.
  sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'Red Hat Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
};

export interface EmailRow {
  label: string;
  value: string;
  /** Render value as a mailto link */
  isEmail?: boolean;
  /** Highlight (e.g. rating stars) */
  accent?: boolean;
}

export interface EmailBlock {
  /** Heading above the block */
  label: string;
  /** Body text (preserves line breaks) */
  text: string;
  /** Render in monospace (e.g. a TSV row) */
  mono?: boolean;
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function rowsHtml(rows: EmailRow[]): string {
  return rows
    .map((r, i) => {
      const bg = i % 2 === 1 ? BRAND.elevated : "transparent";
      const value = r.isEmail
        ? `<a href="mailto:${esc(r.value)}" style="color:${BRAND.accent};text-decoration:none;">${esc(r.value)}</a>`
        : `<span style="color:${r.accent ? "#f5a623" : BRAND.textPrimary};">${esc(r.value)}</span>`;
      return `
        <tr style="background:${bg};">
          <td style="padding:10px 16px;font-weight:600;color:${BRAND.textMuted};font-size:13px;white-space:nowrap;vertical-align:top;">${esc(r.label)}</td>
          <td style="padding:10px 16px;color:${BRAND.textPrimary};font-size:14px;">${value}</td>
        </tr>`;
    })
    .join("");
}

function blocksHtml(blocks: EmailBlock[]): string {
  return blocks
    .map(
      (b) => `
      <div style="margin-top:18px;padding:16px;background:${BRAND.elevated};border:1px solid ${BRAND.border};border-radius:10px;">
        <p style="margin:0 0 8px;font-weight:700;color:${BRAND.textMuted};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">${esc(b.label)}</p>
        <p style="margin:0;color:${BRAND.textSecondary};font-size:14px;line-height:1.6;white-space:pre-wrap;${b.mono ? `font-family:${BRAND.mono};word-break:break-all;background:${BRAND.canvas};padding:12px;border-radius:6px;border:1px solid ${BRAND.border};` : ""}">${esc(b.text)}</p>
      </div>`,
    )
    .join("");
}

export interface BusinessEmailOptions {
  heading: string;
  intro?: string;
  rows: EmailRow[];
  blocks?: EmailBlock[];
  footnote?: string;
}

/**
 * Build a branded HTML business-notification email (dark theme, violet accent).
 */
export function renderBusinessEmail({
  heading,
  intro,
  rows,
  blocks = [],
  footnote,
}: BusinessEmailOptions): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.canvas};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;font-family:${BRAND.sans};">
        <!-- Header -->
        <tr>
          <td style="padding:22px 28px;background:linear-gradient(135deg, ${BRAND.accent} 0%, #6d28d9 100%);">
            <span style="font-family:${BRAND.sans};font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">Blancobyte<span style="color:#e9d5ff;margin-left:10px;">Enquiry</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:26px 28px 30px;">
            <h1 style="margin:0 0 ${intro ? "6px" : "18px"};font-family:${BRAND.sans};font-size:19px;font-weight:700;color:${BRAND.textPrimary};">${esc(heading)}</h1>
            ${intro ? `<p style="margin:0 0 18px;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">${esc(intro)}</p>` : ""}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
              ${rowsHtml(rows)}
            </table>
            ${blocksHtml(blocks)}
            ${footnote ? `<p style="margin:22px 0 0;font-size:12px;color:${BRAND.textMuted};line-height:1.6;">${esc(footnote)}</p>` : ""}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;background:${BRAND.canvas};border-top:1px solid ${BRAND.border};">
            <p style="margin:0;font-size:11px;color:${BRAND.textMuted};">Sent from the BlancoByte website at <a href="https://blancobyte.com" style="color:${BRAND.accent};text-decoration:none;">blancobyte.com</a>. BlancoByte provides private, secure database solutions.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Plain-text fallback for better deliverability and accessibility. */
export function renderBusinessEmailText({
  heading,
  rows,
  blocks = [],
  footnote,
}: BusinessEmailOptions): string {
  const lines = [heading, ""];
  for (const r of rows) lines.push(`${r.label}: ${r.value}`);
  for (const b of blocks) {
    lines.push("", `${b.label}:`, b.text);
  }
  if (footnote) lines.push("", footnote);
  lines.push("", "Sent from blancobyte.com");
  return lines.join("\n");
}

/** Resolve the business recipient: dedicated env var, else the SMTP account. */
export function businessRecipient(): string | undefined {
  BRAND;
  return (
    process.env.CONTACT_EMAIL ||
    process.env.BUSINESS_EMAIL ||
    process.env.SMTP_EMAIL
  );
}

export interface ConfirmationEmailOptions {
  /** The submitter's first name (or full name). */
  name: string;
  /** Heading shown to the submitter, e.g. "Thanks for requesting a demo". */
  heading: string;
  /** One or two sentences of body copy. */
  body: string;
  /** Optional copy of what they submitted, shown back to them. */
  blocks?: EmailBlock[];
}

/**
 * Build a branded, customer-facing confirmation email (dark theme, violet accent).
 * This is sent to the person who submitted the form, with appropriate wording,
 * not a copy of the internal business notification.
 */
export function renderConfirmationEmail({
  name,
  heading,
  body,
  blocks = [],
}: ConfirmationEmailOptions): string {
  const firstName = (name || "there").trim().split(/\s+/)[0];
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.canvas};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;font-family:${BRAND.sans};">
        <tr>
          <td style="padding:22px 28px;background:linear-gradient(135deg, ${BRAND.accent} 0%, #6d28d9 100%);">
            <span style="font-family:${BRAND.sans};font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">Blancobyte<span style="color:#e9d5ff;margin-left:10px;">Enquiry</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 28px 30px;">
            <h1 style="margin:0 0 12px;font-family:${BRAND.sans};font-size:20px;font-weight:700;color:${BRAND.textPrimary};">${esc(heading)}</h1>
            <p style="margin:0 0 16px;color:${BRAND.textSecondary};font-size:15px;line-height:1.6;">Hi ${esc(firstName)},</p>
            <p style="margin:0 0 16px;color:${BRAND.textSecondary};font-size:15px;line-height:1.6;">${esc(body)}</p>
            ${blocks.length ? `<p style="margin:22px 0 0;font-weight:700;color:${BRAND.textMuted};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">A copy of what you sent</p>${blocksHtml(blocks)}` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:${BRAND.canvas};border-top:1px solid ${BRAND.border};">
            <p style="margin:0;font-size:11px;color:${BRAND.textMuted};">You are receiving this because you contacted us through <a href="https://blancobyte.com" style="color:${BRAND.accent};text-decoration:none;">blancobyte.com</a>. BlancoByte provides private, secure database solutions.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Plain-text fallback for the confirmation email. */
export function renderConfirmationEmailText({
  name,
  heading,
  body,
  blocks = [],
}: ConfirmationEmailOptions): string {
  const firstName = (name || "there").trim().split(/\s+/)[0];
  const lines = [heading, "", `Hi ${firstName},`, "", body];
  if (blocks.length) {
    lines.push("", "A copy of what you sent:");
    for (const b of blocks) lines.push(`${b.label}: ${b.text}`);
  }
  lines.push("", "blancobyte.com");
  return lines.join("\n");
}
