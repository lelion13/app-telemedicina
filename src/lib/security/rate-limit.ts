type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  rateLimitBuckets?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  if (!globalForRateLimit.rateLimitBuckets) {
    globalForRateLimit.rateLimitBuckets = new Map();
  }
  return globalForRateLimit.rateLimitBuckets;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  const store = getStore();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { allowed: true };
  }

  if (bucket.count >= options.maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  bucket.count += 1;
  store.set(key, bucket);
  return { allowed: true };
}

export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  consulta: { windowMs: 60 * 1000, maxRequests: 40 },
  patientApi: { windowMs: 60 * 1000, maxRequests: 30 },
} as const;

export function resetRateLimitStore(): void {
  globalForRateLimit.rateLimitBuckets = undefined;
}
