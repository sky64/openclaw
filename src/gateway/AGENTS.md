# src/gateway — WebSocket Control Plane

Single-user WebSocket server coordinating channels, agents, tools, nodes, and clients. 190 files, ~38K LOC.

## Structure

```
gateway/
├── server.impl.ts             # Main startup orchestration
├── server-methods.ts          # RPC method routing + auth scopes
├── server-methods/            # 36 handler modules (86+ RPC methods)
├── server/
│   └── ws-connection/         # WebSocket lifecycle + message dispatch
├── protocol/
│   └── schema/                # TypeBox frame schemas (Connect, Hello, Request, Response)
├── server-http.ts             # HTTP endpoints (hooks, OpenAI compat, tools, avatars)
├── server-channels.ts         # Channel lifecycle management
├── server-broadcast.ts        # Event broadcasting to connected clients
├── server-cron.ts             # Cron job service
├── server-discovery-runtime.ts # mDNS/Bonjour
├── server-tailscale.ts        # Tailscale Serve/Funnel
├── node-registry.ts           # Device node subscriptions
├── auth.ts                    # Auth validation (token, password, Tailscale, device)
└── test-helpers.*             # E2E test setup/teardown
```

## Where to Look

| Task | Location |
|------|----------|
| Add RPC method | `server-methods/<name>.ts` + export handlers object |
| Auth logic | `auth.ts` — `authorizeGatewayConnect()` |
| Protocol types | `protocol/schema/frames.ts` (TypeBox), `protocol/index.ts` |
| HTTP endpoints | `server-http.ts` — hooks, webhooks, `/v1/*` OpenAI compat |
| Channel lifecycle | `server-channels.ts` — start/stop/reload channels |
| Broadcasting | `server-broadcast.ts` — `broadcast(event, payload)` |
| WS handshake | `server/ws-connection/message-handler.ts` — auth + dispatch |
| Node RPC | `server-methods/nodes.ts` — `node.invoke`, `node.pair.*` |
| E2E tests | `test-helpers.server.ts` — `installGatewayTestHooks()` |

## Conventions

- **Handler pattern**: Export `const fooHandlers: GatewayRequestHandlers = { "method.name": async ({params, respond, context}) => {...} }`.
- **Auth scopes**: `operator.admin`, `operator.write`, `operator.read`, `operator.approvals`, `operator.pairing`. Assign in `server-methods.ts`.
- **Deduplication**: RPC methods support idempotency keys — cached 5 minutes.
- **Broadcasting**: Use `broadcast(event, payload, { dropIfSlow: true })` — never block on slow clients.
- **Port derivation**: Gateway=18789, Browser=+1, Canvas=+2.
- **Protocol changes**: Update TypeBox schemas in `protocol/schema/`, then run `pnpm protocol:gen` + `pnpm protocol:gen:swift`.
- **Test state**: Use `testState` object in `test-helpers.mocks.ts` for config/auth in tests.
- **Max payload**: 100 MB. Max buffered per client: 50 MB.

## Anti-Patterns

- Never add blocking operations in broadcast handlers — `dropIfSlow` exists for a reason.
- Never skip auth scope assignment for new methods — all methods must have explicit scopes.
- Never modify protocol schemas without regenerating Swift models (`pnpm protocol:gen:swift`).
- Never hold locks across WebSocket message boundaries — keep handlers stateless.
