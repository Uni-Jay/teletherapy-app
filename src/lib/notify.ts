import "server-only";
import { APP_NAME } from "@/lib/constants";

/** Sends an email through Resend. Skips quietly (and logs) when no API key is set. */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;
  if (!key) {
    console.info(`[email skipped – no RESEND_API_KEY] to=${to} subject=${subject}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
  return res.ok;
}

/** Converts local Nigerian numbers (080…) to international format (23480…). */
export function normaliseNgPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
  return digits;
}

/** Sends an SMS through Termii. Skips quietly when not configured. */
export async function sendSms(phone: string | null | undefined, message: string) {
  const key = process.env.TERMII_API_KEY;
  if (!key || !phone) {
    if (phone) console.info(`[sms skipped – no TERMII_API_KEY] to=${phone}`);
    return false;
  }
  const base = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
  const res = await fetch(`${base}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      to: normaliseNgPhone(phone),
      from: process.env.TERMII_SENDER_ID || "MindGuide",
      sms: message,
      type: "plain",
      channel: "generic",
    }),
  });
  if (!res.ok) console.error("Termii error", res.status, await res.text());
  return res.ok;
}

export function emailLayout(title: string, body: string, cta?: { label: string; url: string }) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1d2a2a">
  <h2 style="color:#3b33a6;font-family:Arial,sans-serif">Mind<span style="color:#3b33a6">Guide</span> <span style="color:#c026a8">AI</span></h2>
  <h3>${title}</h3>
  <div style="line-height:1.6">${body}</div>
  ${cta ? `<p><a href="${cta.url}" style="display:inline-block;background:#3b33a6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${cta.label}</a></p>` : ""}
  <p style="font-size:12px;color:#5f6f6d">If you are in immediate danger, call 112.</p>
</div>`;
}
