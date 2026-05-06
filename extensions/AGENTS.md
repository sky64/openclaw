# extensions/ — Plugin System

30 extensions: channel plugins, tool plugins, auth providers, and services. Each is a workspace package.

## Extension Types

| Type | Count | Examples |
|------|-------|---------|
| **Channel** | 19 | discord, telegram, slack, msteams, matrix, zalo, twitch, nostr |
| **Tool** | 6 | memory-core, memory-lancedb, llm-task, lobster, open-prose, copilot-proxy |
| **Auth Provider** | 4 | google-antigravity-auth, google-gemini-cli-auth, minimax-portal-auth, qwen-portal-auth |
| **Service** | 1 | diagnostics-otel |

## Extension Structure Pattern

```
extensions/<name>/
├── index.ts                   # Plugin entry point (register function)
├── src/
│   ├── channel.ts             # ChannelPlugin implementation (channels)
│   ├── runtime.ts             # Runtime injection setter
│   ├── monitor.ts             # Inbound message handling
│   ├── send.ts                # Outbound delivery
│   └── *.test.ts              # Colocated tests
└── package.json               # Metadata + openclaw.extensions field
```

## Where to Look

| Task | Location |
|------|----------|
| Create channel plugin | Copy `extensions/discord/` as template |
| Register tools | `api.registerTool(factory, { names: [...] })` |
| Register hooks | `api.on("before_agent_start", handler)` |
| Register CLI commands | `api.registerCli(({program}) => {...}, { commands: [...] })` |
| Plugin SDK types | `src/plugin-sdk/index.ts` (374 lines of exports) |
| Plugin loader | `src/plugins/loader.ts` — discovery + loading |
| Plugin registry | `src/plugins/registry.ts` — aggregates all registrations |

## Conventions

- **Entry point pattern**: Default export `{ id, name, register(api) }`. Call `api.registerChannel()`, `api.registerTool()`, etc. inside `register()`.
- **Runtime injection**: `setFooRuntime(api.runtime)` in register — never import core directly.
- **Dependencies**: Runtime deps in `dependencies`. `openclaw` in `devDependencies` only (uses `workspace:*`). Never `workspace:*` in `dependencies`.
- **Plugin-only deps**: Keep in extension `package.json`, not root.
- **Tool factories**: `(ctx) => tool | tool[] | null`. Check `ctx.sandboxed` to gate tools.
- **Optional tools**: `{ optional: true }` requires explicit allowlist to activate.
- **Config schema**: `emptyPluginConfigSchema()` for no custom config; define Zod schema for custom.
- **Channel metadata**: `openclaw.channel` in `package.json` — id, label, docsPath, order.

## Hooks (Lifecycle Events)

`before_agent_start`, `agent_end`, `before_compaction`, `after_compaction`, `message_received`, `message_sending`, `message_sent`, `before_tool_call`, `after_tool_call`, `tool_result_persist`, `session_start`, `session_end`, `gateway_start`, `gateway_stop`.

## Anti-Patterns

- Never import from `src/` directly — use `openclaw/plugin-sdk` only.
- Never put `workspace:*` in `dependencies` — npm install breaks for end users.
- Never add plugin-only dependencies to root `package.json`.
- Never skip `ctx.sandboxed` check for security-sensitive tools.
