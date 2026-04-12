import { createHmac } from "crypto";

/**
 * Verify the MercadoPago webhook signature.
 * https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 *
 * MP sends x-signature header: "ts=<timestamp>,v1=<hmac-sha256>"
 * The signed string is: "id:<notification_id>;request-id:<x-request-id>;ts:<timestamp>;"
 */
export function verifyMpSignature(params: {
  xSignature: string;
  xRequestId: string;
  notificationId: string;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const { xSignature, xRequestId, notificationId } = params;

  // Parse ts and v1 from x-signature
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${notificationId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expected, v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
