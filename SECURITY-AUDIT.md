# OpenClaw Security Audit Report

**Date:** 2026-02-12
**Scope:** Full codebase security analysis — authentication, code execution, credential storage, network exposure, plugin isolation, prompt injection, dependency security
**Auditor:** Automated analysis (Sisyphus agent)

---

## Overall Assessment

OpenClaw has a **solid security foundation** with timing-safe auth, Ed25519 device signatures, scope-based RPC authorization, comprehensive log redaction, and a deny-by-default exec approval system. However, several gaps exist — particularly around rate limiting, CORS/CSP headers, credential encryption at rest, and plugin isolation — that become significant when the gateway is exposed beyond loopback.

**Risk Profile:** Single-user local-first design. Most findings are low-risk in the default loopback configuration but become critical when exposed via Tailscale Funnel, LAN binding, or reverse proxies.

---

## Findings by Severity

### CRITICAL (7)

#### C1: Browser eval() Injection
- **File:** `src/browser/pw-tools-core.interactions.ts:237-260`
- **Description:** The `evaluateInBrowser()` function uses `new Function()` + `eval()` to execute arbitrary JavaScript in the browser context. The `fnText` parameter (from LLM tool calls) is passed directly to `eval("(" + fnBody + ")")` with no sanitization, CSP enforcement, or origin validation.
- **Impact:** A compromised or prompt-injected agent can execute arbitrary JavaScript in any browser page, including credential theft, session hijacking, or DOM manipulation.
- **Remediation:** Add input validation/sanitization for `fnText`. Consider a restricted evaluator that only allows specific function patterns. Add CSP headers to the browser context.

#### C2: No Rate Limiting
- **File:** All HTTP handlers in `src/gateway/server-http.ts`
- **Description:** No rate limiting exists on any HTTP endpoint — hooks, OpenAI-compatible API, tools invoke, or WebSocket upgrades. An attacker with a valid token (or exploiting a leaked token) can flood the gateway.
- **Impact:** Denial of service, resource exhaustion, amplification attacks via webhook/hook endpoints.
- **Remediation:** Add per-IP and per-token rate limiting middleware. Start with conservative limits on auth endpoints and hook handlers.

#### C3: No CORS/CSP Headers
- **File:** `src/gateway/server-http.ts`
- **Description:** No CORS headers are set on any HTTP response. No Content-Security-Policy headers. The `sendJson()` helper sets only `Content-Type`. When exposed via Tailscale Funnel or LAN, any origin can make requests to the gateway.
- **Impact:** Cross-origin request forgery, clickjacking, script injection via third-party pages when gateway is network-accessible.
- **Remediation:** Add strict CORS headers (allowlist only expected origins). Add CSP headers. Add X-Frame-Options and X-Content-Type-Options headers.

#### C4: Workspace Prompt Injection
- **File:** `src/agents/system-prompt.ts:292-314`
- **Description:** Workspace files (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, skill files) are loaded and injected directly into the system prompt without sanitization. A malicious file in the workspace can inject arbitrary instructions into the agent's system prompt.
- **Impact:** Full agent behavior manipulation — the agent could be instructed to exfiltrate data, execute malicious commands, or bypass safety guardrails.
- **Remediation:** Add content sanitization for workspace files. Consider sandboxing workspace file content within clearly delimited blocks. Add integrity checks or checksums for workspace files.

#### C5: Elevated Mode Full Bypass
- **File:** `src/agents/bash-tools.exec.ts:891-900`
- **Description:** When elevated mode is set to `"full"`, the exec approval system is completely bypassed — `requiresExecApproval()` returns `false` for all commands. This is by design for the owner's main session, but the bypass is absolute with no audit trail, no command logging, and no restricted command blocklist.
- **Impact:** Any command including destructive system operations (`rm -rf /`, `dd`, network reconfig) executes without checks when elevated mode is active.
- **Remediation:** Even in "full" elevated mode, maintain a small blocklist of catastrophically destructive commands. Add audit logging for all elevated executions. Consider a confirmation prompt for high-risk commands.

#### C6: Plaintext Credential Storage
- **File:** `src/infra/json-file.ts`
- **Description:** All credentials (WhatsApp auth state, API tokens, channel tokens) are stored as plaintext JSON files with `chmod 0o600` protection. No encryption at rest. File permissions are the only protection.
- **Impact:** Any process running as the same user, or root, can read all stored credentials. Backup systems, cloud sync, or disk cloning will capture plaintext secrets.
- **Remediation:** Implement encryption at rest using a master key derived from a user passphrase or OS keychain (macOS Keychain, Linux secret-tool, Windows DPAPI). At minimum, encrypt sensitive fields within the JSON files.

#### C7: No Plugin Isolation
- **Files:** `src/plugins/loader.ts`, `src/plugins/registry.ts`, `src/plugins/runtime/index.ts`
- **Description:** Plugins (extensions) run in the same Node.js process as the gateway with full access to the runtime. No sandboxing, no capability restrictions, no resource limits. A malicious or compromised plugin has full access to all credentials, all channels, and all system resources.
- **Impact:** Complete system compromise from a single malicious plugin. Supply chain attack vector via npm dependencies of plugins.
- **Remediation:** Run plugins in separate worker threads or child processes with limited capabilities. Implement a permission model where plugins declare required capabilities and users approve them. Consider using Node.js `--experimental-permission` flag for filesystem/network restrictions.

---

### HIGH (12)

#### H1: Shell Variable Expansion
- **Description:** Shell commands constructed from user/agent input may undergo variable expansion (`$HOME`, `$PATH`, etc.) or command substitution (`` `cmd` ``, `$(cmd)`) if not properly quoted. While the exec system uses shell parsing, certain edge cases in command construction could lead to unintended expansion.
- **Remediation:** Audit all command construction paths. Ensure proper escaping/quoting of user-provided arguments.

#### H2: Symlink Bypass in File Operations
- **Description:** File read/write/edit tools resolve paths but may not fully prevent symlink traversal outside the workspace or allowed directories, especially in sandbox mode.
- **Remediation:** Add `O_NOFOLLOW` checks or `lstat()` validation before file operations in sandboxed contexts.

#### H3: Host Workdir Traversal
- **Description:** The bash tool's working directory resolution may allow path traversal (`../../../etc/passwd`) when constructing paths from agent-provided input, especially in non-sandboxed mode.
- **Remediation:** Validate resolved paths are within expected boundaries before execution.

#### H4: SSRF via Web Fetch Tool — MITIGATED
- **File:** `src/agents/tools/web-fetch.ts`, `src/infra/net/ssrf.ts`
- **Description:** The `web_fetch` tool already has comprehensive SSRF protection via `src/infra/net/ssrf.ts`: private IPv4/IPv6 blocking (10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x, fc/fd/fe80, ::1), blocked hostnames (localhost, *.local, *.internal, metadata.google.internal), DNS rebinding protection via pinned lookups, and a `createPinnedDispatcher` that validates resolved IPs before connecting.
- **Status:** Already mitigated. No further action required.

#### H5: Tool Policy Enforcement Gap
- **File:** `src/agents/pi-tools.policy.ts`
- **Description:** Tool policy (allow/deny lists per session) is enforced at the tool registration level, but a compromised agent could potentially reference tool names that bypass the policy check if tool name normalization is inconsistent.
- **Remediation:** Ensure tool name normalization is consistent between registration and invocation. Add runtime policy checks at invocation time, not just registration.

#### H6: WhatsApp Keys Stored in Plaintext
- **Description:** WhatsApp Baileys auth state (signal protocol keys, session keys, sender keys) is stored as plaintext JSON files under `~/.openclaw/credentials/`. These keys provide full access to the WhatsApp session.
- **Remediation:** Encrypt WhatsApp credential store. Consider using OS keychain integration.

#### H7: Silent Device Pairing (mDNS)
- **Description:** Device discovery via mDNS/Bonjour broadcasts the gateway's presence on the local network. While pairing requires auth, the discovery itself leaks information about the gateway's existence, port, and capabilities.
- **Remediation:** Make mDNS advertising opt-in rather than default. Add a configuration option to disable discovery.

#### H8: No Audit Logging
- **Description:** No structured audit log exists for security-relevant events: authentication attempts (success/failure), tool executions, configuration changes, credential access, or plugin loads. The existing logging system (`src/logging/`) provides operational logs but not a security audit trail.
- **Remediation:** Implement a dedicated audit log subsystem that records authentication events, tool executions, configuration changes, and credential access with timestamps and source information.

#### H9: Glob/Brace Expansion in Commands
- **Description:** The exec approval allowlist evaluates shell commands after parsing but before glob/brace expansion. A command matching the allowlist could expand to operate on unintended files via glob patterns.
- **Remediation:** Consider post-expansion validation for sensitive paths, or document the limitation clearly.

#### H10: Data Exfiltration Paths
- **Description:** The agent has access to multiple outbound channels (web_fetch, browser, messaging channels) that could be used to exfiltrate data if the agent is compromised via prompt injection. No data loss prevention (DLP) controls exist.
- **Remediation:** Consider adding outbound request logging, content inspection for sensitive patterns (API keys, credentials), and alerting for unusual outbound traffic patterns.

#### H11: TOCTOU Race in Exec Approvals
- **File:** `src/infra/exec-approvals.ts`
- **Description:** The exec approval check evaluates the command string, but there's a time-of-check-to-time-of-use gap between approval evaluation and actual execution. In theory, a symlinked binary could be swapped between check and execution.
- **Remediation:** For high-security environments, resolve binary paths to absolute paths and verify at execution time.

#### H12: Exec Socket Token in Plaintext
- **Description:** The exec tool's internal communication token (used for process session management) is generated and stored in memory but could be exposed via process inspection or core dumps.
- **Remediation:** Use secure memory for sensitive tokens. Consider ephemeral tokens that rotate per session.

---

### MEDIUM (9)

#### M1: mDNS Information Disclosure
- **Description:** mDNS/Bonjour service advertising exposes the gateway's service name, port, and metadata on the local network.
- **Remediation:** Make mDNS opt-in. Minimize advertised metadata.

#### M2: Tailscale Header Spoofing
- **Description:** When Tailscale mode is active, the gateway trusts `X-Forwarded-For` headers from the Tailscale proxy. If an attacker can inject traffic upstream of the Tailscale proxy (unlikely but possible in misconfigured networks), they could spoof the client IP.
- **Remediation:** Validate that the connecting IP is actually the Tailscale proxy before trusting forwarded headers. The existing `isTrustedProxyAddress()` partially addresses this.

#### M3: Incomplete Log Redaction
- **File:** `src/logging/redact.ts`
- **Description:** Log redaction covers 15 regex patterns (API keys, tokens, phone numbers, etc.) but may miss custom credential formats, base64-encoded secrets, or non-standard token formats.
- **Remediation:** Add configurable redaction patterns. Consider a deny-by-default approach where all values above a certain entropy threshold are redacted.

#### M4: Plugin Override Risk
- **Description:** Plugins can register tools with names that shadow built-in tools, potentially overriding security-critical functionality.
- **Remediation:** Prevent plugins from overriding built-in tool names. Add a namespace prefix for plugin-provided tools.

#### M5: Advisory Content Wrapping
- **File:** `src/security/external-content.ts`
- **Description:** External content is wrapped with advisory markers but the wrapping itself could be manipulated if the content contains the same marker strings.
- **Remediation:** Use unique, randomly-generated boundary markers for each content injection. Validate that content doesn't contain the boundary string.

#### M6: Environment Variable Visibility
- **Description:** Environment variables (potentially containing secrets) are accessible to all tools running in the agent process. The exec tool inherits the full environment by default.
- **Remediation:** Filter environment variables passed to child processes. Only pass explicitly allowlisted env vars.

#### M7: Large WebSocket Payloads
- **Description:** WebSocket messages up to 100 MB are accepted. While there's a per-client buffer limit (50 MB), large payloads could still cause memory pressure.
- **Remediation:** Consider reducing the max payload size. Add payload size validation per message type.

#### M8: Short Pairing Codes
- **Description:** DM pairing codes are relatively short, increasing the risk of brute-force guessing in open-DM configurations.
- **Remediation:** Increase pairing code length/complexity. Add rate limiting on pairing attempts. Consider time-limited pairing codes.

#### M9: Temp File Persistence
- **Description:** Temporary files created during media processing may persist on disk after use, potentially containing sensitive content.
- **Remediation:** Implement aggressive temp file cleanup. Use secure deletion where available.

---

### LOW (6)

#### L1: Deprecated Query Parameter Tokens
- **File:** `src/gateway/server-http.ts:88-94`
- **Description:** Hook tokens can still be provided via query parameters (deprecated, with a warning logged). Query parameter tokens appear in server logs, browser history, and referrer headers.
- **Remediation:** Remove query parameter token support after a deprecation period. Currently mitigated by the warning log.

#### L2: innerHTML in Canvas Bundle
- **Description:** The A2UI canvas bundle (`src/canvas-host/a2ui/`) may use innerHTML or similar DOM APIs that could introduce XSS if content is not properly sanitized.
- **Remediation:** Audit canvas bundle for XSS vectors. Use textContent or sanitized HTML rendering.

#### L3: npm Audit Advisories
- **Description:** 5 npm audit advisories found in dependencies:
  - `@buape/carbon > hono` (4 advisories)
  - `@line/bot-sdk > axios` (1 advisory)
  - `minimatch > brace-expansion` (1 advisory)
  - `@aws-sdk/xml-builder > fast-xml-parser` (1 advisory)
  - `express > qs` (1 advisory)
- **Remediation:** Update affected transitive dependencies where possible. Note: Carbon dependency must not be updated (per project constraints). Monitor advisories and apply patches as upstream releases become available.

#### L4: Unsigned Session Keys
- **Description:** Session keys used for agent session management are not cryptographically signed, relying on the single-user trust model for integrity.
- **Remediation:** For multi-user or exposed deployments, consider signing session keys to prevent tampering.

#### L5: No MAC Enforcement
- **Description:** No message authentication codes (MACs) are used on stored data, meaning tampered credential files or session data would not be detected.
- **Remediation:** Add HMACs to stored credential files to detect tampering.

#### L6: No OAuth Token Rotation
- **Description:** OAuth tokens (when used) may not be rotated on a regular schedule, increasing the window of exposure if a token is compromised.
- **Remediation:** Implement automatic token rotation with configurable intervals.

---

## Strengths

The codebase demonstrates strong security practices in several areas:

1. **Timing-safe authentication** (`src/gateway/auth.ts`) — Uses `crypto.timingSafeEqual()` for token/password comparison, preventing timing side-channel attacks.
2. **Scope-based RPC authorization** (`src/gateway/server-methods.ts`) — All 86+ RPC methods have explicit scope assignments (`operator.admin`, `operator.write`, `operator.read`, etc.).
3. **DM pairing by default** — Unknown senders receive a pairing code and are not processed until approved, preventing unauthorized access.
4. **File permissions** (`src/infra/json-file.ts`) — Credential files are written with `0o600` permissions (owner-only read/write).
5. **Comprehensive log redaction** (`src/logging/redact.ts`) — 15 regex patterns cover API keys, tokens, phone numbers, URLs with credentials, and more.
6. **Exec approval system** (`src/infra/exec-approvals.ts`) — Deny-by-default allowlist system with glob pattern matching, binary resolution, and safety checks.
7. **Shell parsing** — Uses proper shell lexer (`shell-quote-word`) for command parsing rather than naive string splitting.
8. **Ed25519 device authentication** — Device nodes authenticate with Ed25519 signatures, providing strong cryptographic identity.
9. **Built-in security audit** (`src/security/audit.ts`) — The `openclaw doctor` command performs runtime security checks on DM policies, file permissions, and configuration.
10. **Webhook authentication** — Hook endpoints require bearer tokens with timing-safe comparison.
11. **SSH hardening** — Remote gateway access via SSH tunnels provides encrypted transport.
12. **Docker sandbox defaults** — Sandbox mode drops ALL capabilities, uses read-only root filesystem, and disables networking.
13. **SSRF protection** (`src/infra/net/ssrf.ts`) — Comprehensive private IP blocking, DNS rebinding prevention via pinned lookups, and blocked hostname detection for the web_fetch tool.

---

## Remediation Roadmap

### Immediate (Week 1) — Quick Wins

| Finding | Action | Effort |
|---------|--------|--------|
| C2 | Add basic rate limiting to HTTP endpoints | Medium |
| C3 | Add CORS, CSP, X-Frame-Options, X-Content-Type-Options headers | Low |
| L1 | Remove deprecated query parameter token support | Low |
| ~~H4~~ | ~~Add SSRF protection to web_fetch~~ — Already mitigated in `src/infra/net/ssrf.ts` | N/A |
| M7 | Review and potentially reduce max WebSocket payload size | Low |

### Short-term (Weeks 2-4) — Core Hardening

| Finding | Action | Effort |
|---------|--------|--------|
| C1 | Add input validation/sanitization to browser eval() | Medium |
| C5 | Add audit logging + small blocklist for elevated mode | Medium |
| H8 | Implement security audit logging subsystem | Medium |
| H10 | Add outbound request logging and DLP alerts | Medium |
| M6 | Filter environment variables in child processes | Low |
| M8 | Increase pairing code complexity + add rate limiting | Low |

### Medium-term (Months 1-2) — Architecture Improvements

| Finding | Action | Effort |
|---------|--------|--------|
| C4 | Add workspace file sanitization + integrity checks | High |
| C6 | Implement credential encryption at rest (OS keychain) | High |
| C7 | Add plugin isolation (worker threads or child processes) | High |
| H1 | Audit and harden all shell command construction | Medium |
| H5 | Strengthen tool policy enforcement with runtime checks | Medium |
| H11 | Add TOCTOU mitigation for exec approvals | Medium |

### Long-term (Months 2-6) — Defense in Depth

| Finding | Action | Effort |
|---------|--------|--------|
| H2 | Add symlink validation for sandboxed file operations | Medium |
| H3 | Implement path traversal prevention in bash tool | Medium |
| M2 | Strengthen Tailscale proxy validation | Low |
| M3 | Add configurable log redaction patterns | Medium |
| M4 | Add plugin tool namespace enforcement | Medium |
| M5 | Use random boundary markers for external content | Low |
| L5 | Add HMACs to stored credential files | Medium |

---

## Methodology

- **Static analysis:** Manual code review of authentication, authorization, code execution, credential storage, network exposure, input validation, and plugin boundaries.
- **Dependency audit:** `pnpm audit` for known vulnerabilities in npm dependencies.
- **Pattern search:** Automated search for dangerous patterns (`eval()`, `new Function()`, `child_process`, `innerHTML`, unsanitized `fetch()`, missing CORS/CSP).
- **Architecture review:** Analysis of trust boundaries, data flow, and attack surface across the gateway, agent runtime, channels, and plugin system.
- **Files analyzed:** 20+ security-critical source files across `src/gateway/`, `src/agents/`, `src/infra/`, `src/security/`, `src/browser/`, `src/plugins/`, `src/logging/`, and `src/pairing/`.

---

## Notes

- This audit assumes the default single-user, loopback-only deployment. Findings marked as CRITICAL become significantly more important when the gateway is exposed to the network.
- The project's built-in `openclaw doctor` command covers runtime configuration checks but does not perform the code-level analysis documented here.
- Dependency advisories are subject to change as upstream packages release fixes.
