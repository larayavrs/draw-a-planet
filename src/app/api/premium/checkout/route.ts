import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getPreferenceClient } from "@/lib/mercadopago/client";

const PREMIUM_PRICE_USD = 5.0;

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const preference = getPreferenceClient();

    const result = await preference.create({
      body: {
        items: [
          {
            id: "premium-onetime",
            title: "Draw-a-Planet Premium (One-Time)",
            description: "Unlock all planet types, unlimited colors, permanent planets, and more.",
            unit_price: PREMIUM_PRICE_USD,
            quantity: 1,
            currency_id: "USD",
          },
        ],
        payer: {
          email: user.email!,
        },
        back_urls: {
          success: `${appUrl}/premium/success`,
          pending: `${appUrl}/premium`,
          failure: `${appUrl}/premium`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        metadata: {
          user_id: user.id,
        },
      },
    });

    if (!result.init_point) {
      throw new Error("No init_point returned");
    }

    return NextResponse.json({ init_point: result.init_point });
  } catch (err) {
    console.error("[checkout] MercadoPago error:", err);
    return NextResponse.json({ error: "checkout_error" }, { status: 500 });
  }
}
