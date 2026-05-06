# src/auto-reply — Inbound Reply Pipeline

9-stage pipeline transforming inbound messages into outbound replies. 207 files, ~41K LOC.

## Structure

```
auto-reply/
├── dispatch.ts                # High-level inbound entry point
├── types.ts                   # Core types (GetReplyOptions, ReplyPayload)
├── templating.ts              # Message context types and template vars
├── reply/                     # Reply generation pipeline (128 files)
│   ├── get-reply.ts           # Pipeline orchestrator
│   ├── agent-runner.ts        # Agent execution + streaming
│   ├── block-reply-pipeline.ts # Block buffering + coalescing
│   ├── reply-dispatcher.ts    # Reply normalization + delivery
│   ├── dispatch-from-config.ts # Config-driven dispatch with TTS
│   ├── route-reply.ts         # Provider-agnostic routing
│   ├── session.ts             # Session init + state mgmt
│   ├── followup-runner.ts     # Queued reply execution
│   ├── get-reply-directives.ts # Directive resolution
│   ├── directive-handling.*   # Inline directive parsing
│   ├── commands-*.ts          # Command handlers (/status, /think, /new, /compact)
│   └── queue/                 # Queue modes (steer, followup, collect, interrupt)
└── (inbound processing, media, link understanding)
```

## Where to Look

| Task | Location |
|------|----------|
| Add chat command | `reply/commands-core.ts` (dispatch) + new `reply/commands-<name>.ts` |
| Add inline directive | `reply/directive-handling.parse.ts` + `reply/directive-handling.impl.ts` |
| Modify reply flow | `reply/get-reply.ts` — pipeline stages 1-8 |
| Agent execution | `reply/agent-runner.ts` — `runReplyAgent()` |
| Queue modes | `reply/queue/settings.ts` — steer/followup/collect/interrupt |
| Session init | `reply/session.ts` — `initSessionState()` |
| Block streaming | `reply/block-reply-pipeline.ts` — buffering + coalescing |
| Response prefix | `reply/response-prefix-template.ts` — `{model}`, `{provider}` vars |

## Pipeline Stages

1. **Dispatch** → `dispatch.ts` (dedup, TTS, hooks)
2. **Session Init** → `reply/session.ts` (load/create, reset triggers)
3. **Media/Link Understanding** → enrich context
4. **Directive Resolution** → `reply/get-reply-directives.ts` (parse `/think`, `/model`)
5. **Command Handling** → `reply/commands-core.ts` (return early if command-only)
6. **Queue Resolution** → `reply/queue/settings.ts` (steer vs followup vs collect)
7. **Agent Execution** → `reply/agent-runner.ts` (model fallback, streaming)
8. **Reply Dispatch** → `reply/reply-dispatcher.ts` (normalize, human delay, route)
9. **Queue Drain** → `reply/followup-runner.ts` (process queued followups)

## Conventions

- **Channel integration**: Channels call `dispatchInboundMessage()` with `MsgContext` + `ReplyDispatcher`.
- **Callback-driven**: Channels provide `deliver()` callback — auto-reply never imports channel directly.
- **Streaming**: Tool results, block replies, reasoning streamed via `GetReplyOptions` callbacks.
- **Session scope**: `"per-sender"` (default), `"per-group"`, or `"main"`.
- **Queue modes**: `steer` (immediate), `followup` (queue), `collect` (batch), `interrupt` (abort current).
- **ReplyPayload**: `{ text?, mediaUrl?, mediaUrls?, replyToId?, audioAsVoice?, isError? }`.

## Anti-Patterns

- Never import channel-specific code from auto-reply — use dispatcher callbacks.
- Never skip deduplication in `dispatch.ts` — prevents double-processing.
- Never bypass directive authorization — elevated mode has security implications.
