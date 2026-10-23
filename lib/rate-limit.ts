interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding-window rate limiter for sensitive endpoints.
 * @param key unique identifier (e.g. IP address + route)
 * @param limit maximum allowed requests in the window
 * @param windowMs time window in milliseconds (default: 60s)
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60 * 1000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record || now > record.resetAt) {
    tracker.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetIn: Math.ceil((record.resetAt - now) / 1000),
  };
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetAt) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
