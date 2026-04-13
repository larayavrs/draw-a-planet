/**
 * Returns a 16-char hex fingerprint of an IP address.
 *
 * A static salt prevents rainbow-table reversal — raw IPs are never stored.
 * The output length (16 hex chars = 64 bits) is sufficient to distinguish
 * visitors while keeping the value opaque.
 */
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT ?? "dap-draw-a-planet";
  const data = new TextEncoder().encode(salt + ip);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
