/**
 * In-process sliding-window rate limiter.
 *
 * Keyed by `${action}:${userId}` so limits are independent per action.
 * Works correctly for a single-instance deployment (serverless functions that
 * share the same process). For multi-instance deployments a Redis-backed store
 * would be needed.
 */

interface Entry {
  count: number;
  resetAt: number; // epoch ms when the window resets
}

// Module-level store — persists across requests in the same process/worker.
const store = new Map<string, Entry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // requests left in the current window
  resetInMs: number; // ms until the window resets
}

/**
 * Check and consume one token for `userId` under `action`.
 *
 * @param action   Identifies which limit to apply (e.g. "planet:create")
 * @param userId   The authenticated user's ID
 * @param max      Maximum requests allowed in the window
 * @param windowMs Window duration in milliseconds (default 60 s)
 */
export function checkRateLimit(
  action: string,
  userId: string,
  max: number,
  windowMs = 60_000,
): RateLimitResult {
  const key = `${action}:${userId}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetInMs: windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: max - entry.count,
    resetInMs: entry.resetAt - now,
  };
}

// ── Per-tier limits ───────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  "planet:create": { registered: 5, premium: 15 },
  "planet:delete": { registered: 10, premium: 20 },
} as const satisfies Record<string, { registered: number; premium: number }>;

export type RateLimitAction = keyof typeof RATE_LIMITS;
