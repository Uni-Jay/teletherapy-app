import { NextResponse, type NextRequest } from "next/server";
import { isValidSignature, type PaystackTransaction } from "@/lib/paystack";
import { recordSuccessfulPayment } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Paystack webhook. Set this URL in Paystack → Settings → API Keys & Webhooks:
 *   https://YOUR-DOMAIN/api/paystack/webhook
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!isValidSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const event = JSON.parse(raw) as { event: string; data: Record<string, unknown> };
  const admin = createAdminClient();

  try {
    switch (event.event) {
      case "charge.success":
        await recordSuccessfulPayment(event.data as unknown as PaystackTransaction);
        break;

      case "subscription.create": {
        const d = event.data as { subscription_code: string; email_token: string; next_payment_date?: string; customer: { customer_code: string } };
        await admin
          .from("subscriptions")
          .update({ paystack_subscription_code: d.subscription_code, paystack_email_token: d.email_token, updated_at: new Date().toISOString() })
          .eq("paystack_customer_code", d.customer.customer_code);
        break;
      }

      case "subscription.not_renew":
      case "subscription.disable": {
        const d = event.data as { subscription_code: string };
        await admin.from("subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("paystack_subscription_code", d.subscription_code);
        break;
      }

      case "invoice.payment_failed": {
        const d = event.data as { subscription?: { subscription_code?: string } };
        if (d.subscription?.subscription_code) {
          await admin.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("paystack_subscription_code", d.subscription.subscription_code);
        }
        break;
      }
    }
  } catch (e) {
    console.error("Webhook handling failed", event.event, e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
