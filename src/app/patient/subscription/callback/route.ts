import { NextResponse, type NextRequest } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { recordSuccessfulPayment } from "@/lib/billing";

/** Paystack sends the patient back here after checkout. The webhook also activates plans, so this is a fast path. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const back = new URL("/patient/subscription", request.nextUrl.origin);
  if (!reference) return NextResponse.redirect(back);
  try {
    const tx = await verifyTransaction(reference);
    if (tx.status === "success") {
      await recordSuccessfulPayment(tx);
      back.searchParams.set("paid", "1");
    } else {
      back.searchParams.set("pending", "1");
    }
  } catch (e) {
    console.error("verify failed", e);
    back.searchParams.set("pending", "1");
  }
  return NextResponse.redirect(back);
}
