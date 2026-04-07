import { describe, expect, test } from "vitest";
import { getFreePort, installGatewayTestHooks, startGatewayServer } from "./test-helpers.js";

installGatewayTestHooks({ scope: "suite" });

describe("gateway HTTP security headers", () => {
  test("responses include security headers", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/nonexistent`);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("x-xss-protection")).toBe("0");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
      expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      // No HSTS on plain HTTP
      expect(res.headers.get("strict-transport-security")).toBeNull();
    } finally {
      void server.close();
    }
  });

  test("OPTIONS preflight returns 204", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/any-path`, {
        method: "OPTIONS",
      });
      expect(res.status).toBe(204);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    } finally {
      void server.close();
    }
  });

  test("does not set Access-Control-Allow-Origin for cross-origin requests", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/nonexistent`, {
        headers: { Origin: "http://evil.example.com" },
      });
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    } finally {
      void server.close();
    }
  });

  test("sets CORS headers for same-origin requests", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port);
    try {
      const origin = `http://127.0.0.1:${port}`;
      const res = await fetch(`${origin}/nonexistent`, {
        headers: { Origin: origin },
      });
      expect(res.headers.get("access-control-allow-origin")).toBe(origin);
      expect(res.headers.get("access-control-allow-methods")).toBe("GET, POST, OPTIONS");
      expect(res.headers.get("access-control-allow-headers")).toContain("Authorization");
      expect(res.headers.get("access-control-allow-headers")).toContain("X-OpenClaw-Token");
      expect(res.headers.get("access-control-max-age")).toBe("86400");
    } finally {
      void server.close();
    }
  });
});
