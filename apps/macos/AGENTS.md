# apps/macos — OpenClaw Menu Bar App

SwiftUI menu bar app: Gateway control plane, voice wake, canvas, WebChat. 296 files (Swift).

## Structure

```
apps/macos/
├── Sources/OpenClaw/
│   ├── AppState.swift                # @Observable root state
│   ├── GatewayConnection.swift       # Gateway WS client (737 LOC, all RPC methods)
│   ├── GatewayProcessManager.swift   # Daemon lifecycle (launchd)
│   ├── GatewayEndpointStore.swift    # Endpoint resolution (local, SSH, Tailscale)
│   ├── CLIInstaller.swift            # CLI download + install
│   ├── CanvasManager.swift           # A2UI canvas in WebKit
│   ├── VoiceWakeRuntime.swift        # Wake word detection
│   ├── TalkModeRuntime.swift         # Continuous conversation
│   ├── Settings/                     # Channel config, onboarding
│   └── Resources/                    # Assets, Info.plist, entitlements
├── Sources/OpenClawDiscovery/        # mDNS/Bonjour gateway discovery
├── Tests/                            # XCTest suites
└── Package.swift                     # SPM dependencies
```

Shared code: `apps/shared/OpenClawKit/` (iOS + macOS).

## Where to Look

| Task | Location |
|------|----------|
| Add Gateway RPC call | `GatewayConnection.swift` — add async method |
| Shared WS protocol | `apps/shared/OpenClawKit/Sources/OpenClawKit/GatewayChannel.swift` |
| Protocol models | `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift` (auto-generated) |
| Node commands | `apps/shared/OpenClawKit/Sources/OpenClawKit/*Commands.swift` |
| Chat UI | `apps/shared/OpenClawKit/Sources/OpenClawChatUI/` |
| Bridge protocol | `apps/shared/OpenClawKit/Sources/OpenClawKit/BridgeFrames.swift` |
| Settings UI | `Sources/OpenClaw/Settings/` |

## Conventions

- **State management**: Use `@Observable` + `@Bindable` (Observation framework). Never introduce new `ObservableObject`/`@StateObject`.
- **Gateway calls**: All RPC calls go through `GatewayConnection.shared` actor — never create ad-hoc WS connections.
- **Protocol changes**: Run `pnpm protocol:gen:swift` after TypeBox schema changes. `GatewayModels.swift` is auto-generated — never edit manually.
- **Code signing**: Signed builds required for macOS permissions to stick across rebuilds.
- **Packaging**: `scripts/package-mac-app.sh` for dev, `scripts/package-mac-dist.sh` for release.
- **Notarization**: `NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary scripts/package-mac-dist.sh`.
- **Sparkle updates**: `APP_BUILD` must be numeric + monotonic for version compare.

## Anti-Patterns

- Never rebuild over SSH — must run directly on Mac.
- Never edit `GatewayModels.swift` manually — regenerate via `pnpm protocol:gen:swift`.
- Never start ad-hoc Gateway processes from tmux — use the app or `scripts/restart-mac.sh`.
- Never use `ObservableObject`/`@StateObject` for new code — use `@Observable`.
- Never hardcode colors — use the shared palette.
