import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";

const SECRET = new TextEncoder().encode(process.env.GUEST_TOKEN_SECRET!);

export interface GuestPayload {
  jti: string;
  session_id: string;
  role: "guest";
}

export async function signGuestJwt(sessionId: string): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ session_id: sessionId, role: "guest" })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyGuestJwt(
  token: string
): Promise<GuestPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as GuestPayload;
  } catch {
    return null;
  }
}

/** Hash the JWT jti for storage in guest_sessions.session_token */
export function hashJti(jti: string): string {
  return createHash("sha256").update(jti).digest("hex");
}

/** Hash an IP address for storage (privacy-preserving) */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}
