import "server-only";
import crypto from "node:crypto";

const BASE = "https://api.paystack.co";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(BASE + path, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || json.status === false) throw new Error(json.message || `Paystack error ${res.status}`);
  return json.data as T;
}

/** Starts a checkout. When `plan` is a Paystack plan code, Paystack creates a recurring subscription. */
export function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  plan?: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      plan: input.plan || undefined,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  channel: string;
  paid_at: string;
  metadata: { patient_id?: string; plan?: string } | null;
  customer: { customer_code: string; email: string };
};

export function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function disableSubscription(code: string, token: string) {
  return call("/subscription/disable", { method: "POST", body: JSON.stringify({ code, token }) });
}

export function isValidSignature(rawBody: string, signature: string | null) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const hash = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  return hash.length === signature.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
