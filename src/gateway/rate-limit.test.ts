import { describe, it, expect, beforeEach, vi } from "vitest";
import { RateLimiter, createRateLimiter } from "./rate-limit.js";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 });
  });

  it("allows requests up to the limit", () => {
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
  });

  it("blocks requests after the limit is exceeded", () => {
    for (let i = 0; i < 3; i++) {
      limiter.check("1.2.3.4");
    }
    const result = limiter.check("1.2.3.4");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(1000);
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < 3; i++) {
      limiter.check("1.1.1.1");
    }
    expect(limiter.check("1.1.1.1").allowed).toBe(false);
    expect(limiter.check("2.2.2.2").allowed).toBe(true);
  });

  it("allows requests again after the window expires", () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 3; i++) {
        limiter.check("1.2.3.4");
      }
      expect(limiter.check("1.2.3.4").allowed).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(limiter.check("1.2.3.4").allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reset clears all state", () => {
    for (let i = 0; i < 3; i++) {
      limiter.check("1.2.3.4");
    }
    expect(limiter.check("1.2.3.4").allowed).toBe(false);

    limiter.reset();

    expect(limiter.check("1.2.3.4").allowed).toBe(true);
  });

  it("returns retryAfterMs of 0 for allowed requests", () => {
    const result = limiter.check("5.5.5.5");
    expect(result.retryAfterMs).toBe(0);
  });
});

describe("createRateLimiter", () => {
  it("creates a limiter with default options", () => {
    const limiter = createRateLimiter();
    const result = limiter.check("10.0.0.1");
    expect(result.allowed).toBe(true);
  });

  it("creates a limiter with custom options", () => {
    const limiter = createRateLimiter({ windowMs: 500, maxRequests: 1 });
    expect(limiter.check("10.0.0.1").allowed).toBe(true);
    expect(limiter.check("10.0.0.1").allowed).toBe(false);
  });
});
