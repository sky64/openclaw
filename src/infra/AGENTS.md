# src/infra — Infrastructure Layer

System utilities, outbound messaging, networking, and cross-cutting concerns. 183 files, ~31K LOC.

## Structure

```
infra/
├── outbound/                  # Message delivery pipeline (31 files)
│   ├── message.ts             # Public API: sendMessage(), sendPoll()
│   ├── deliver.ts             # Payload delivery engine with chunking
│   ├── outbound-session.ts    # Session routing + peer resolution (28KB)
│   ├── message-action-runner.ts # Channel action execution (30KB)
│   ├── targets.ts             # Target resolution + validation
│   └── target-resolver.ts     # Messaging target lookup
├── net/                       # Network utilities
├── tls/                       # TLS/certificate handling
├── json-file.ts               # Secure JSON persistence (chmod 0o600)
├── ports.ts                   # Port availability checking
├── bonjour*.ts                # mDNS/Bonjour discovery
├── tailscale.ts               # Tailscale integration
├── ssh-tunnel.ts              # SSH tunneling
├── exec-approvals.ts          # Execution safety gates
├── retry*.ts                  # Retry logic + policies
├── heartbeat-runner.ts        # Presence heartbeat
├── provider-usage*.ts         # Provider usage tracking (Anthropic, OpenAI, Gemini)
└── device-pairing.ts          # Device identity + pairing
```

## Where to Look

| Task | Location |
|------|----------|
| Send a message | `outbound/message.ts` → `sendMessage()` |
| Delivery pipeline | `outbound/deliver.ts` → `deliverOutboundPayloads()` |
| Target resolution | `outbound/targets.ts` + `outbound/target-resolver.ts` |
| Channel actions | `outbound/message-action-runner.ts` (reactions, edits, unsends) |
| JSON persistence | `json-file.ts` — `loadJsonFile()` / `saveJsonFile()` |
| Port management | `ports.ts`, `ports-inspect.ts`, `ports-lsof.ts` |
| Exec approval flow | `exec-approvals.ts` — approve/deny tool execution |
| Usage tracking | `provider-usage.fetch.*.ts` (per-provider) |

## Conventions

- **DI via OutboundSendDeps**: `sendMessage()` accepts `deps` parameter with channel send functions. Use `createDefaultDeps()` or `createOutboundSendDeps()`.
- **JSON file security**: Always `chmod 0o600` for credentials/config. Use `saveJsonFile()` helper.
- **Delivery modes**: `"direct"` (channel sends) vs `"gateway"` (routed through WS).
- **Chunking**: Channel-specific text limits. Use `plugin.outbound.chunker()` or default markdown chunker.
- **Retry pattern**: `retry()` with exponential backoff, jitter, configurable cap.
- **Target resolution cascade**: Explicit `to` → last known target → session store → error.

## Anti-Patterns

- Never call channel send functions directly — always go through `outbound/message.ts`.
- Never store sensitive data without `chmod 0o600` — use `saveJsonFile()`.
- Never hardcode port numbers — derive from gateway port or use `getFreePort()`.
- `message-action-runner.ts` (30KB) and `outbound-session.ts` (28KB) are oversized — extract helpers when touching.
