import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getPreApprovalClient } from "@/lib/mercadopago/client";

const CheckoutSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
});

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = CheckoutSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { plan } = body.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Determine pricing
  const isAnnual = plan === "annual";
  const amount = isAnnual ? 7.99 : 9.99; // annual = $95.88/yr ÷ 12
  const frequency = isAnnual ? 12 : 1;

  try {
    const preApproval = getPreApprovalClient();

    const result = await preApproval.create({
      body: {
        reason: `Draw-a-Planet Premium — ${isAnnual ? "Annual" : "Monthly"}`,
        auto_recurring: {
          frequency,
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "USD",
        },
        back_url: `${appUrl}/premium/success`,
        payer_email: user.email!,
      },
    });

    if (!result.init_point) {
      throw new Error("No init_point returned");
    }

    // Store pending subscription
    const serviceClient = getSupabaseServiceClient();
    await serviceClient.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan,
        status: "pending",
        mercadopago_subscription_id: result.id,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + (isAnnual ? 365 : 30) * 86400_000
        ).toISOString(),
      },
      { onConflict: "mercadopago_subscription_id" }
    );

    return NextResponse.json({ init_point: result.init_point });
  } catch (err) {
    console.error("[checkout] MercadoPago error:", err);
    return NextResponse.json({ error: "checkout_error" }, { status: 500 });
  }
}
