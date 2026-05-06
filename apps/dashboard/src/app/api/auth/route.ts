import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"

/**
 * POST /api/auth
 *
 * Validates the dashboard password server-side.
 * The secret never reaches the client — it lives only in DASHBOARD_SECRET.
 * Uses timing-safe comparison to prevent timing oracle attacks.
 */
export async function POST(request: Request) {
  let body: { password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const password = body.password
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password required" }, { status: 400 })
  }

  const secret = process.env.DASHBOARD_SECRET
  if (!secret) {
    // No secret configured — deny all access rather than open the gate
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 })
  }

  // Timing-safe comparison to prevent timing oracle attacks
  const encoder = new TextEncoder()
  const a = encoder.encode(password)
  const b = encoder.encode(secret)

  // Buffers must be the same byte length for timingSafeEqual
  const maxLen = Math.max(a.length, b.length)
  const aBuf = Buffer.alloc(maxLen)
  const bBuf = Buffer.alloc(maxLen)
  aBuf.set(a)
  bBuf.set(b)

  const match = a.length === b.length && timingSafeEqual(aBuf, bBuf)

  if (!match) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
