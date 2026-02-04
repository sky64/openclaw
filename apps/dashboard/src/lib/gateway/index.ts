/**
 * Gateway client library for the Sky64 Dashboard.
 * Provides WebSocket RPC communication with the OpenClaw gateway.
 */

export { GatewayClient } from "./client"
export {
  GatewayProvider,
  GatewayContext,
  useGateway,
  useGatewayEvent,
  useChat,
  type GatewayContextValue,
} from "./hooks"
export type {
  // Frame types
  RequestFrame,
  ResponseFrame,
  EventFrame,
  Frame,
  ErrorShape,
  StateVersion,
  // Health and status
  HealthSnapshot,
  ChannelStatus,
  ChannelAccountSnapshot,
  ChannelsStatusResult,
  // Chat
  ChatMessage,
  ChatAttachment,
  ChatEvent,
  ChatSendParams,
  ChatAbortParams,
  ChatHistoryParams,
  // Sessions
  SessionInfo,
  SessionsListParams,
  // Agents
  AgentInfo,
  AgentSummary,
  // Logs
  LogEntry,
  LogsTailParams,
  LogsTailResult,
  // Config
  ConfigGetParams,
  ConfigSetParams,
  // Connection
  HelloOk,
  Snapshot,
  PresenceEntry,
  ConnectParams,
} from "./types"
