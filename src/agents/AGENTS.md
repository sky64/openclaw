# src/agents — Agent Runtime & Tools

Agent execution engine: Pi embedded runner, tool system, session management, inter-agent communication. Largest module (438 files, ~75K LOC).

## Structure

```
agents/
├── pi-embedded-runner/        # Agent execution engine (run, attempt, compact, history)
│   └── run/                   # Single attempt orchestration + params
├── pi-embedded-subscribe.*    # Event streaming (block replies, tool results, reasoning)
├── pi-embedded-helpers/       # Error classification, failover logic
├── tools/                     # Tool implementations (37 files)
├── bash-tools.*               # Bash exec (1571 LOC) + process mgmt (665 LOC)
├── system-prompt.*            # System prompt building (629 LOC)
├── model-*                    # Model selection, auth, failover, config
├── subagent-*                 # Subagent registry + completion announcements
├── sandbox/                   # Docker sandbox config + context
├── skills/                    # Workspace skills loading
└── auth-profiles.*            # OAuth/API key rotation + cooldown
```

## Where to Look

| Task | Location |
|------|----------|
| Add new tool | `tools/<name>-tool.ts` + register in `openclaw-tools.ts` |
| Tool schema | Use `Type.Object({...})` from TypeBox; see `tools/browser-tool.schema.ts` |
| Agent run flow | `pi-embedded-runner/run.ts` → `run/attempt.ts` |
| Streaming events | `pi-embedded-subscribe.ts` (onBlockReply, onToolResult, onPartialReply) |
| Error handling | `pi-embedded-helpers/errors.ts` — classifies auth, rate-limit, context overflow |
| Model failover | `model-fallback.ts` — retry logic on auth/rate errors |
| Auth profiles | `auth-profiles.ts` — rotation, cooldown tracking |
| Subagent spawning | `subagent-registry.ts` + `tools/sessions-spawn-tool.ts` |
| System prompt | `system-prompt.ts` — builds from workspace files + skills |
| Sandbox config | `sandbox/config.ts` — resolves allowlist/denylist per session |

## Conventions

- **Tool schemas**: Always `Type.Object({...})` at top level. Never `Type.Union()`. Use `stringEnum()` for flat enums, `Type.Optional(...)` instead of `| null`. Avoid `anyOf`/`oneOf`/`allOf`.
- **Tool schema guardrails**: No raw `format` property names (reserved keyword in some validators).
- **Provider quirks**: Schema normalization happens in `pi-tools.schema.ts` — Claude, OpenAI, Gemini each need different handling.
- **Session keys**: Format `{kind}:{id}` — e.g., `main`, `group:123`, `subagent:parent:child`.
- **DI pattern**: Tools receive `abortSignal` for cancellation; callbacks for streaming.
- **Concurrency**: Lane-based queuing via `resolveSessionLane()`. Session write locks prevent concurrent transcript writes.
- **Config merging**: `agents.defaults` → `agents.list[].overrides` → runtime params.
- **Large files**: `bash-tools.exec.ts` (1571 LOC), `pi-embedded-runner/run/attempt.ts` (908 LOC) — avoid growing further, extract helpers.

## Anti-Patterns

- Never suppress tool execution errors silently — always propagate via `AgentToolResult`.
- Never add `as any` in tool result handling — use proper typing.
- Never bypass tool policy (`pi-tools.policy.ts`) — sandbox enforcement is security-critical.
- Never hardcode provider-specific logic in tools — use `pi-tools.schema.ts` normalization.
- Tool call ID sanitization required for Mistral/Google — see `sanitizeToolCallId()`.
