type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const attempts = new Map<string, RateLimitEntry>();

export function takeRateLimitHit(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.expiresAt <= now) {
    attempts.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  entry.count += 1;
  attempts.set(key, entry);

  return {
    allowed: entry.count <= maxAttempts,
    remaining: Math.max(maxAttempts - entry.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((entry.expiresAt - now) / 1000), 1),
  };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
