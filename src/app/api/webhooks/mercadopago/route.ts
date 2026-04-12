import { NextRequest, NextResponse } from "next/server";
import { verifyMpSignature } from "@/lib/mercadopago/webhooks";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getPaymentClient } from "@/lib/mercadopago/client";

export async function POST(req: NextRequest) {
  // ── 1. Verify signature ────────────────────────────────────────────────
  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  const body = await req.json();
  const notificationId = body?.data?.id ?? body?.id ?? "";
  const type = body?.type ?? body?.action ?? "";

  if (!verifyMpSignature({ xSignature, xRequestId, notificationId })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── 2. Only handle payment events (one-time purchases) ─────────────────
  if (type !== "payment") {
    return NextResponse.json({ ok: true });
  }

  try {
    const paymentClient = getPaymentClient();
    const serviceClient = getSupabaseServiceClient();

    // ── 3. Fetch full payment from MP API ────────────────────────────────
    const mpPayment = await paymentClient.get({ id: notificationId });

    if (!mpPayment || !mpPayment.id) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // ── 4. Only process approved payments ────────────────────────────────
    if (mpPayment.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    // ── 5. Get user_id from metadata ─────────────────────────────────────
    const metadata = mpPayment.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.user_id as string | undefined;

    if (!userId) {
      // Fallback: try to get from payer
      return NextResponse.json({ error: "No user_id in payment metadata" }, { status: 400 });
    }

    // ── 6. Check for duplicate (idempotency) ─────────────────────────────
    const { data: existing } = await serviceClient
      .from("premium_purchases")
      .select("id")
      .eq("mercadopago_payment_id", String(mpPayment.id))
      .single();

    if (existing) {
      return NextResponse.json({ ok: true }); // Already processed
    }

    // ── 7. Record the purchase ───────────────────────────────────────────
    await serviceClient
      .from("premium_purchases")
      .insert({
        user_id: userId,
        mercadopago_payment_id: String(mpPayment.id),
        amount: mpPayment.transaction_amount ?? 5.0,
        status: "completed",
      });

    // ── 8. Upgrade user to premium permanently ───────────────────────────
    await serviceClient
      .from("users")
      .update({ tier: "premium", premium_purchased_at: new Date().toISOString() })
      .eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp-webhook] error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
