import { NextRequest, NextResponse } from "next/server";
import { verifyMpSignature } from "@/lib/mercadopago/webhooks";
import { getPreApprovalClient } from "@/lib/mercadopago/client";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // ── 1. Verify signature ────────────────────────────────────────────────
  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  const body = await req.json();
  const notificationId = body?.data?.id ?? body?.id ?? "";

  if (!verifyMpSignature({ xSignature, xRequestId, notificationId })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── 2. Only handle subscription events ────────────────────────────────
  const type = body?.type ?? body?.action;
  if (!["subscription_preapproval", "payment"].includes(type)) {
    return NextResponse.json({ ok: true }); // Acknowledge but ignore
  }

  try {
    const preApproval = getPreApprovalClient();
    const serviceClient = getSupabaseServiceClient();

    // ── 3. Fetch full preapproval from MP API ────────────────────────────
    const subscriptionId = notificationId;
    const mpSub = await preApproval.get({ id: subscriptionId });

    if (!mpSub || !mpSub.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // ── 4. Look up our subscription row ──────────────────────────────────
    const { data: existing } = await serviceClient
      .from("subscriptions")
      .select("id, user_id")
      .eq("mercadopago_subscription_id", mpSub.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Subscription not in DB" }, { status: 404 });
    }

    // ── 5. Map MP status → our status ─────────────────────────────────────
    const statusMap: Record<string, string> = {
      authorized: "active",
      active: "active",
      paused: "past_due",
      cancelled: "cancelled",
      pending: "pending",
    };
    const newStatus = statusMap[mpSub.status ?? ""] ?? "past_due";

    // Compute next period end
    let periodEnd = new Date(Date.now() + 30 * 86400_000).toISOString();
    const summarized = mpSub.summarized as Record<string, unknown> | undefined;
    if (mpSub.auto_recurring?.transaction_amount && summarized?.next_payment_due_date) {
      periodEnd = new Date(summarized.next_payment_due_date as string).toISOString();
    }

    // ── 6. Upsert subscription ─────────────────────────────────────────────
    await serviceClient
      .from("subscriptions")
      .update({
        status: newStatus,
        current_period_end: periodEnd,
        cancelled_at: newStatus === "cancelled" ? new Date().toISOString() : null,
      })
      .eq("id", existing.id);

    // The sync_user_tier DB trigger fires automatically on subscription update.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp-webhook] error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
