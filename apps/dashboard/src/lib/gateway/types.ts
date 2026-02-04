/**
 * Gateway protocol types for WebSocket RPC communication.
 * Based on the OpenClaw gateway protocol schema.
 */

// Frame types for the JSON-RPC-like protocol

export interface RequestFrame {
  type: "req"
  id: string
  method: string
  params?: Record<string, unknown>
}

export interface ResponseFrame {
  type: "res"
  id: string
  ok: boolean
  payload?: unknown
  error?: ErrorShape
}

export interface EventFrame {
  type: "event"
  event: string
  payload?: unknown
  seq?: number
  stateVersion?: StateVersion
}

export type Frame = RequestFrame | ResponseFrame | EventFrame

export interface ErrorShape {
  code: string
  message: string
  details?: unknown
  retryable?: boolean
  retryAfterMs?: number
}

export interface StateVersion {
  presence: number
  health: number
}

// Health and status types

export interface HealthSnapshot {
  ok: boolean
  uptime: number
  version: string
  channels: Record<string, { connected: boolean; error?: string }>
}

export interface ChannelStatus {
  name: string
  connected: boolean
  username?: string
  error?: string
  configured?: boolean
  enabled?: boolean
  lastConnectedAt?: number
  lastError?: string
}

export interface ChannelAccountSnapshot {
  accountId: string
  name?: string
  enabled?: boolean
  configured?: boolean
  linked?: boolean
  running?: boolean
  connected?: boolean
  reconnectAttempts?: number
  lastConnectedAt?: number
  lastError?: string
  lastStartAt?: number
  lastStopAt?: number
  lastInboundAt?: number
  lastOutboundAt?: number
  lastProbeAt?: number
  mode?: string
  dmPolicy?: string
  allowFrom?: string[]
  tokenSource?: string
  botTokenSource?: string
  appTokenSource?: string
  baseUrl?: string
  allowUnmentionedGroups?: boolean
  cliPath?: string | null
  dbPath?: string | null
  port?: number | null
  probe?: unknown
  audit?: unknown
  application?: unknown
}

export interface ChannelsStatusResult {
  ts: number
  channelOrder: string[]
  channelLabels: Record<string, string>
  channelDetailLabels?: Record<string, string>
  channelSystemImages?: Record<string, string>
  channels: Record<string, unknown>
  channelAccounts: Record<string, ChannelAccountSnapshot[]>
  channelDefaultAccountId: Record<string, string>
}

// Chat types

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  attachments?: ChatAttachment[]
}

export interface ChatAttachment {
  type: "image" | "file" | "tool_output"
  name?: string
  url?: string
  content?: string
  mimeType?: string
}

export interface ChatEvent {
  runId: string
  sessionKey: string
  seq: number
  state: "delta" | "final" | "aborted" | "error"
  message?: unknown
  errorMessage?: string
  usage?: unknown
  stopReason?: string
}

export interface ChatSendParams {
  sessionKey: string
  message: string
  thinking?: string
  deliver?: boolean
  attachments?: unknown[]
  timeoutMs?: number
  idempotencyKey: string
}

export interface ChatAbortParams {
  sessionKey: string
  runId?: string
}

export interface ChatHistoryParams {
  sessionKey: string
  limit?: number
}

// Session types

export interface SessionInfo {
  id: string
  key: string
  title?: string
  createdAt: number
  updatedAt: number
  messageCount: number
  label?: string
  agentId?: string
  lastMessage?: string
}

export interface SessionsListParams {
  limit?: number
  activeMinutes?: number
  includeGlobal?: boolean
  includeUnknown?: boolean
  includeDerivedTitles?: boolean
  includeLastMessage?: boolean
  label?: string
  spawnedBy?: string
  agentId?: string
  search?: string
}

// Agent types

export interface AgentInfo {
  id: string
  name: string
  status: "idle" | "busy" | "error"
  model?: string
  description?: string
}

export interface AgentSummary {
  id: string
  name?: string
  status?: string
  model?: string
}

// Log types

export interface LogEntry {
  timestamp: number
  level: "debug" | "info" | "warn" | "error"
  message: string
  source?: string
}

export interface LogsTailParams {
  cursor?: number
  limit?: number
  maxBytes?: number
}

export interface LogsTailResult {
  file: string
  cursor: number
  size: number
  lines: string[]
  truncated?: boolean
  reset?: boolean
}

// Config types

export interface ConfigGetParams {
  key?: string
  keys?: string[]
}

export interface ConfigSetParams {
  key: string
  value: unknown
}

// Connection types

export interface HelloOk {
  type: "hello-ok"
  protocol: number
  server: {
    version: string
    commit?: string
    host?: string
    connId: string
  }
  features: {
    methods: string[]
    events: string[]
  }
  snapshot: Snapshot
  canvasHostUrl?: string
  auth?: {
    deviceToken: string
    role: string
    scopes: string[]
    issuedAtMs?: number
  }
  policy: {
    maxPayload: number
    maxBufferedBytes: number
    tickIntervalMs: number
  }
}

export interface Snapshot {
  presence: PresenceEntry[]
  health: unknown
  stateVersion: StateVersion
  uptimeMs: number
  configPath?: string
  stateDir?: string
  sessionDefaults?: {
    defaultAgentId: string
    mainKey: string
    mainSessionKey: string
    scope?: string
  }
}

export interface PresenceEntry {
  host?: string
  ip?: string
  version?: string
  platform?: string
  deviceFamily?: string
  modelIdentifier?: string
  mode?: string
  lastInputSeconds?: number
  reason?: string
  tags?: string[]
  text?: string
  ts: number
  deviceId?: string
  roles?: string[]
  scopes?: string[]
  instanceId?: string
}

// Connect params for handshake

export interface ConnectParams {
  minProtocol: number
  maxProtocol: number
  client: {
    id: string
    displayName?: string
    version: string
    platform: string
    mode: string
    instanceId?: string
  }
  caps?: string[]
  commands?: string[]
  permissions?: Record<string, boolean>
  pathEnv?: string
  auth?: {
    token?: string
    password?: string
  }
  role?: string
  scopes?: string[]
}
