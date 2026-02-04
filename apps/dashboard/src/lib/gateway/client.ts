/**
 * Gateway WebSocket RPC client for communicating with the OpenClaw gateway.
 * Implements a JSON-RPC-like protocol with request/response and event handling.
 */

import type {
  EventFrame,
  ResponseFrame,
  RequestFrame,
  HelloOk,
  HealthSnapshot,
  ChannelsStatusResult,
  SessionInfo,
  ChatMessage,
  ChatSendParams,
  ChatAbortParams,
  ChatHistoryParams,
  LogsTailParams,
  LogsTailResult,
  ConfigGetParams,
  ConfigSetParams,
  SessionsListParams,
  ConnectParams,
} from "./types"

const PROTOCOL_VERSION = 1
const DEFAULT_TIMEOUT_MS = 30_000
const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000

type EventCallback = (event: EventFrame) => void
type Unsubscribe = () => void

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

interface GatewayClientOptions {
  url: string
  token?: string
  clientId?: string
  clientVersion?: string
  platform?: string
  onConnect?: () => void
  onDisconnect?: (code: number, reason: string) => void
  onError?: (error: Error) => void
}

export class GatewayClient {
  private url: string
  private token: string | undefined
  private clientId: string
  private clientVersion: string
  private platform: string

  private ws: WebSocket | null = null
  private pending = new Map<string, PendingRequest>()
  private eventListeners = new Map<string, Set<EventCallback>>()
  private wildcardListeners = new Set<EventCallback>()
  private idCounter = 0
  private closed = false
  private connected = false
  private reconnectAttempts = 0
  private backoffMs = INITIAL_BACKOFF_MS
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private helloOk: HelloOk | null = null
  private connectNonce: string | null = null
  private connectSent = false

  private onConnectCallback?: () => void
  private onDisconnectCallback?: (code: number, reason: string) => void
  private onErrorCallback?: (error: Error) => void

  constructor(options: GatewayClientOptions) {
    this.url = options.url
    this.token = options.token
    this.clientId = options.clientId ?? "sky64-dashboard"
    this.clientVersion = options.clientVersion ?? "0.1.0"
    this.platform = options.platform ?? "web"
    this.onConnectCallback = options.onConnect
    this.onDisconnectCallback = options.onDisconnect
    this.onErrorCallback = options.onError
  }

  /**
   * Connect to the gateway WebSocket server.
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return
    }

    this.closed = false
    this.connectSent = false
    this.connectNonce = null

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            this.ws?.close()
            reject(new Error("Connection timeout"))
          }
        }, DEFAULT_TIMEOUT_MS)

        this.ws.onopen = () => {
          // Wait for connect.challenge event before sending connect
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as
              | EventFrame
              | ResponseFrame
            this.handleMessage(data, resolve, connectionTimeout)
          } catch (err) {
            const error =
              err instanceof Error ? err : new Error(String(err))
            this.onErrorCallback?.(error)
          }
        }

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout)
          const wasConnected = this.connected
          this.connected = false
          this.helloOk = null
          this.flushPendingErrors(
            new Error(`WebSocket closed: ${event.code} ${event.reason}`)
          )
          this.onDisconnectCallback?.(event.code, event.reason)

          if (!this.closed && wasConnected) {
            this.scheduleReconnect()
          } else if (!this.closed && !wasConnected) {
            reject(new Error(`Failed to connect: ${event.code} ${event.reason}`))
          }
        }

        this.ws.onerror = (event) => {
          const error = new Error("WebSocket error")
          this.onErrorCallback?.(error)
          if (!this.connected) {
            clearTimeout(connectionTimeout)
            reject(error)
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        reject(error)
      }
    })
  }

  private handleMessage(
    data: EventFrame | ResponseFrame,
    connectResolve?: (value: void) => void,
    connectionTimeout?: ReturnType<typeof setTimeout>
  ): void {
    if (data.type === "event") {
      const event = data as EventFrame

      // Handle connect challenge
      if (event.event === "connect.challenge") {
        const payload = event.payload as { nonce?: string } | undefined
        if (payload?.nonce) {
          this.connectNonce = payload.nonce
          this.sendConnect()
        }
        return
      }

      // Dispatch to event listeners
      const listeners = this.eventListeners.get(event.event)
      if (listeners) {
        for (const callback of listeners) {
          try {
            callback(event)
          } catch (err) {
            console.error("Event listener error:", err)
          }
        }
      }

      // Dispatch to wildcard listeners
      for (const callback of this.wildcardListeners) {
        try {
          callback(event)
        } catch (err) {
          console.error("Wildcard listener error:", err)
        }
      }
    } else if (data.type === "res") {
      const response = data as ResponseFrame
      const pending = this.pending.get(response.id)
      if (!pending) {
        return
      }

      clearTimeout(pending.timer)
      this.pending.delete(response.id)

      if (response.ok) {
        // Check if this is the connect response (HelloOk)
        const payload = response.payload as HelloOk | undefined
        if (payload && "type" in payload && payload.type === "hello-ok") {
          this.helloOk = payload
          this.connected = true
          this.reconnectAttempts = 0
          this.backoffMs = INITIAL_BACKOFF_MS
          if (connectionTimeout) {
            clearTimeout(connectionTimeout)
          }
          this.onConnectCallback?.()
          if (connectResolve) {
            connectResolve()
          }
        }
        pending.resolve(response.payload)
      } else {
        const errorMessage =
          response.error?.message ?? "Unknown gateway error"
        pending.reject(new Error(errorMessage))
      }
    }
  }

  private sendConnect(): void {
    if (this.connectSent || !this.ws) {
      return
    }
    this.connectSent = true

    const params: ConnectParams = {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: this.clientId,
        version: this.clientVersion,
        platform: this.platform,
        mode: "dashboard",
      },
      caps: [],
      auth: this.token ? { token: this.token } : undefined,
      role: "operator",
      scopes: ["operator.admin"],
    }

    // Send connect request; the response handling will set connected = true
    void this.request<HelloOk>("connect", params as unknown as Record<string, unknown>).catch((err) => {
      this.onErrorCallback?.(err instanceof Error ? err : new Error(String(err)))
      this.ws?.close(1008, "connect failed")
    })
  }

  /**
   * Disconnect from the gateway.
   */
  disconnect(): void {
    this.closed = true
    this.connected = false

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.flushPendingErrors(new Error("Client disconnected"))
    this.ws?.close(1000, "Client disconnect")
    this.ws = null
    this.helloOk = null
  }

  private flushPendingErrors(error: Error): void {
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject(error)
    }
    this.pending.clear()
  }

  private scheduleReconnect(): void {
    if (this.closed || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return
    }

    this.reconnectAttempts++
    const delay = this.backoffMs
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect().catch((err) => {
        this.onErrorCallback?.(err instanceof Error ? err : new Error(String(err)))
      })
    }, delay)
  }

  private generateId(): string {
    return `${++this.idCounter}-${Date.now()}`
  }

  /**
   * Send an RPC request to the gateway.
   */
  async request<T>(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Gateway not connected")
    }

    const id = this.generateId()
    const frame: RequestFrame = {
      type: "req",
      id,
      method,
      params,
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Request timeout: ${method}`))
      }, timeoutMs)

      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
        timer,
      })

      this.ws!.send(JSON.stringify(frame))
    })
  }

  /**
   * Subscribe to gateway events.
   * @param event Event name or "*" for all events
   * @param callback Function called when event is received
   * @returns Unsubscribe function
   */
  on(event: string, callback: EventCallback): Unsubscribe {
    if (event === "*") {
      this.wildcardListeners.add(callback)
      return () => {
        this.wildcardListeners.delete(callback)
      }
    }

    let listeners = this.eventListeners.get(event)
    if (!listeners) {
      listeners = new Set()
      this.eventListeners.set(event, listeners)
    }
    listeners.add(callback)

    return () => {
      const set = this.eventListeners.get(event)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          this.eventListeners.delete(event)
        }
      }
    }
  }

  /**
   * Check if connected to the gateway.
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Get the HelloOk response from the gateway.
   */
  getHelloOk(): HelloOk | null {
    return this.helloOk
  }

  // Convenience methods

  /**
   * Get gateway health status.
   */
  async health(): Promise<HealthSnapshot> {
    const snapshot = this.helloOk?.snapshot
    if (snapshot) {
      return {
        ok: true,
        uptime: snapshot.uptimeMs,
        version: this.helloOk?.server.version ?? "unknown",
        channels: {},
      }
    }
    throw new Error("Not connected")
  }

  /**
   * Get status of all channels.
   */
  async channelsStatus(
    params?: { probe?: boolean; timeoutMs?: number }
  ): Promise<ChannelsStatusResult> {
    return this.request<ChannelsStatusResult>("channels.status", params)
  }

  /**
   * List sessions.
   */
  async sessionsList(params?: SessionsListParams): Promise<SessionInfo[]> {
    const result = await this.request<{ sessions: SessionInfo[] }>(
      "sessions.list",
      params as unknown as Record<string, unknown>
    )
    return result.sessions ?? []
  }

  /**
   * Get chat history for a session.
   */
  async chatHistory(params: ChatHistoryParams): Promise<ChatMessage[]> {
    const result = await this.request<{ messages: ChatMessage[] }>(
      "chat.history",
      params as unknown as Record<string, unknown>
    )
    return result.messages ?? []
  }

  /**
   * Send a chat message.
   */
  async chatSend(params: ChatSendParams): Promise<{ runId: string }> {
    return this.request<{ runId: string }>(
      "chat.send",
      params as unknown as Record<string, unknown>
    )
  }

  /**
   * Abort an in-progress chat.
   */
  async chatAbort(params: ChatAbortParams): Promise<void> {
    await this.request(
      "chat.abort",
      params as unknown as Record<string, unknown>
    )
  }

  /**
   * Tail gateway logs.
   */
  async logsTail(params?: LogsTailParams): Promise<LogsTailResult> {
    return this.request<LogsTailResult>(
      "logs.tail",
      params as unknown as Record<string, unknown>
    )
  }

  /**
   * Get configuration value(s).
   */
  async configGet<T = unknown>(params?: ConfigGetParams): Promise<T> {
    return this.request<T>(
      "config.get",
      params as unknown as Record<string, unknown>
    )
  }

  /**
   * Set a configuration value.
   */
  async configSet(params: ConfigSetParams): Promise<void> {
    await this.request(
      "config.set",
      params as unknown as Record<string, unknown>
    )
  }

  /**
   * List available agents.
   */
  async agentsList(): Promise<{ agents: Array<{ id: string; name?: string }> }> {
    return this.request<{ agents: Array<{ id: string; name?: string }> }>(
      "agents.list"
    )
  }

  /**
   * List available models.
   */
  async modelsList(): Promise<{ models: Array<{ id: string; name?: string }> }> {
    return this.request<{ models: Array<{ id: string; name?: string }> }>(
      "models.list"
    )
  }
}
