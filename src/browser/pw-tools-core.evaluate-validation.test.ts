import { describe, expect, it, vi } from "vitest";

// Mock pw-session so the module can be imported without a real browser
vi.mock("./pw-session.js", () => ({
  getPageForTargetId: vi.fn(async () => ({})),
  ensurePageState: vi.fn(),
  restoreRoleRefsForTarget: vi.fn(),
  refLocator: vi.fn(),
}));

// Mock the subsystem logger used by the module
vi.mock("../logging/subsystem.js", () => ({
  createSubsystemLogger: () => ({
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  }),
}));

describe("evaluateViaPlaywright validation", () => {
  it("throws when fn is empty", async () => {
    const { evaluateViaPlaywright } = await import("./pw-tools-core.interactions.js");
    await expect(
      evaluateViaPlaywright({ cdpUrl: "http://127.0.0.1:9222", fn: "" }),
    ).rejects.toThrow("function is required");
  });

  it("throws when fn is whitespace-only", async () => {
    const { evaluateViaPlaywright } = await import("./pw-tools-core.interactions.js");
    await expect(
      evaluateViaPlaywright({ cdpUrl: "http://127.0.0.1:9222", fn: "   " }),
    ).rejects.toThrow("function is required");
  });

  it("throws when fn exceeds MAX_EVALUATE_FN_LENGTH", async () => {
    const { evaluateViaPlaywright, MAX_EVALUATE_FN_LENGTH } =
      await import("./pw-tools-core.interactions.js");
    const oversized = "x".repeat(MAX_EVALUATE_FN_LENGTH + 1);
    await expect(
      evaluateViaPlaywright({ cdpUrl: "http://127.0.0.1:9222", fn: oversized }),
    ).rejects.toThrow(/exceeds maximum length/);
  });

  it("does not throw for fn at exactly MAX_EVALUATE_FN_LENGTH", async () => {
    const { evaluateViaPlaywright, MAX_EVALUATE_FN_LENGTH } =
      await import("./pw-tools-core.interactions.js");
    const atLimit = "x".repeat(MAX_EVALUATE_FN_LENGTH);
    // This will fail at the page.evaluate step (mock page), but should NOT throw the length error
    await expect(
      evaluateViaPlaywright({ cdpUrl: "http://127.0.0.1:9222", fn: atLimit }),
    ).rejects.not.toThrow(/exceeds maximum length/);
  });
});
