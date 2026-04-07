interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export interface RateLimiterOptions {
  /** Time window in milliseconds. Default: 60_000 (60s). */
  windowMs?: number;
  /** Max requests per IP within the window. Default: 100. */
  maxRequests?: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 100;
const CLEANUP_INTERVAL = 100;

export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly entries: Map<string, RateLimitEntry> = new Map();
  private checkCount = 0;

  constructor(opts: RateLimiterOptions = {}) {
    this.windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxRequests = opts.maxRequests ?? DEFAULT_MAX_REQUESTS;
  }

  check(ip: string): RateLimitResult {
    const now = Date.now();
    this.checkCount++;

    // Amortized cleanup: purge stale entries every N checks
    if (this.checkCount % CLEANUP_INTERVAL === 0) {
      this.cleanup(now);
    }

    const entry = this.entries.get(ip);

    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.entries.set(ip, { count: 1, windowStart: now });
      return { allowed: true, retryAfterMs: 0 };
    }

    entry.count++;

    if (entry.count <= this.maxRequests) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const retryAfterMs = this.windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  reset(): void {
    this.entries.clear();
    this.checkCount = 0;
  }

  private cleanup(now: number): void {
    const staleThreshold = this.windowMs * 2;
    for (const [ip, entry] of this.entries) {
      if (now - entry.windowStart >= staleThreshold) {
        this.entries.delete(ip);
      }
    }
  }
}

export function createRateLimiter(opts: RateLimiterOptions = {}): RateLimiter {
  return new RateLimiter(opts);
}
