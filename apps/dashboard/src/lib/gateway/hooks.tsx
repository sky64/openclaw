"use client"

/**
 * React hooks for interacting with the OpenClaw gateway.
 * Provides context-based access to the gateway client and convenience hooks.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { GatewayClient } from "./client"
import type {
  EventFrame,
  HealthSnapshot,
  ChatMessage,
  ChatEvent,
} from "./types"

// Context types

interface GatewayContextValue {
  client: GatewayClient | null
  connected: boolean
  health: HealthSnapshot | null
  error: Error | null
  connect: (url: string, token?: string) => Promise<void>
  disconnect: () => void
}

// Context

const GatewayContext = createContext<GatewayContextValue | null>(null)

/**
 * Hook to access the gateway context.
 * Must be used within a GatewayProvider.
 */
export function useGateway(): GatewayContextValue {
  const context = useContext(GatewayContext)
  if (!context) {
    throw new Error("useGateway must be used within GatewayProvider")
  }
  return context
}

/**
 * Subscribe to a specific gateway event.
 * The callback is automatically cleaned up on unmount or when dependencies change.
 */
export function useGatewayEvent(
  event: string,
  callback: (e: EventFrame) => void
): void {
  const { client, connected } = useGateway()
  const callbackRef = useRef(callback)

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!client || !connected) {
      return
    }

    const handler = (e: EventFrame) => {
      callbackRef.current(e)
    }

    const unsubscribe = client.on(event, handler)
    return unsubscribe
  }, [client, connected, event])
}

// Chat hook return type

interface UseChatReturn {
  messages: ChatMessage[]
  loading: boolean
  streaming: boolean
  error: Error | null
  send: (text: string, attachments?: unknown[]) => Promise<void>
  abort: () => Promise<void>
}

/**
 * Hook for chat functionality within a session.
 * Manages message state, loading/streaming indicators, and real-time updates.
 */
export function useChat(sessionKey?: string): UseChatReturn {
  const { client, connected } = useGateway()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const currentRunIdRef = useRef<string | null>(null)
  const streamingContentRef = useRef<string>("")

  // Load initial chat history
  useEffect(() => {
    if (!client || !connected || !sessionKey) {
      setMessages([])
      return
    }

    setLoading(true)
    setError(null)

    client
      .chatHistory({ sessionKey })
      .then((history) => {
        setMessages(history)
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [client, connected, sessionKey])

  // Subscribe to chat events
  useGatewayEvent("chat", (event) => {
    if (!sessionKey) {
      return
    }

    const chatEvent = event.payload as ChatEvent | undefined
    if (!chatEvent || chatEvent.sessionKey !== sessionKey) {
      return
    }

    switch (chatEvent.state) {
      case "delta": {
        // Accumulate streaming content
        if (chatEvent.runId !== currentRunIdRef.current) {
          currentRunIdRef.current = chatEvent.runId
          streamingContentRef.current = ""
          setStreaming(true)
        }
        const deltaContent = extractMessageContent(chatEvent.message)
        if (deltaContent) {
          streamingContentRef.current += deltaContent
          // Update or append streaming message
          setMessages((prev: ChatMessage[]) => {
            const lastMsg = prev[prev.length - 1]
            if (lastMsg?.id === `streaming-${chatEvent.runId}`) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: streamingContentRef.current },
              ]
            }
            return [
              ...prev,
              {
                id: `streaming-${chatEvent.runId}`,
                role: "assistant" as const,
                content: streamingContentRef.current,
                timestamp: Date.now(),
              },
            ]
          })
        }
        break
      }
      case "final": {
        // Replace streaming message with final
        setStreaming(false)
        currentRunIdRef.current = null
        const finalContent = extractMessageContent(chatEvent.message)
        if (finalContent) {
          setMessages((prev: ChatMessage[]) => {
            const filtered = prev.filter(
              (m: ChatMessage) => m.id !== `streaming-${chatEvent.runId}`
            )
            return [
              ...filtered,
              {
                id: chatEvent.runId,
                role: "assistant" as const,
                content: finalContent,
                timestamp: Date.now(),
              },
            ]
          })
        }
        streamingContentRef.current = ""
        break
      }
      case "aborted":
      case "error": {
        setStreaming(false)
        currentRunIdRef.current = null
        if (chatEvent.errorMessage) {
          setError(new Error(chatEvent.errorMessage))
        }
        streamingContentRef.current = ""
        break
      }
    }
  })

  const send = useCallback(
    async (text: string, attachments?: unknown[]): Promise<void> => {
      if (!client || !connected || !sessionKey) {
        throw new Error("Not connected or no session")
      }

      setError(null)

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      }
      setMessages((prev: ChatMessage[]) => [...prev, userMessage])

      try {
        await client.chatSend({
          sessionKey,
          message: text,
          attachments,
          idempotencyKey: crypto.randomUUID(),
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [client, connected, sessionKey]
  )

  const abort = useCallback(async (): Promise<void> => {
    if (!client || !connected || !sessionKey) {
      return
    }

    try {
      await client.chatAbort({
        sessionKey,
        runId: currentRunIdRef.current ?? undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [client, connected, sessionKey])

  return {
    messages,
    loading,
    streaming,
    error,
    send,
    abort,
  }
}

// Helper to extract content from various message formats

function extractMessageContent(message: unknown): string {
  if (typeof message === "string") {
    return message
  }
  if (message && typeof message === "object") {
    const msg = message as Record<string, unknown>
    if (typeof msg.content === "string") {
      return msg.content
    }
    if (typeof msg.text === "string") {
      return msg.text
    }
    if (typeof msg.delta === "string") {
      return msg.delta
    }
    if (msg.content && typeof msg.content === "object") {
      const content = msg.content as Record<string, unknown>
      if (typeof content.text === "string") {
        return content.text
      }
    }
  }
  return ""
}

// Provider component

interface GatewayProviderProps {
  children: ReactNode
  defaultUrl?: string
  defaultToken?: string
  autoConnect?: boolean
}

export function GatewayProvider({
  children,
  defaultUrl,
  defaultToken,
  autoConnect = false,
}: GatewayProviderProps): ReactNode {
  const [client, setClient] = useState<GatewayClient | null>(null)
  const [connected, setConnected] = useState(false)
  const [health, setHealth] = useState<HealthSnapshot | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const connect = useCallback(
    async (url: string, token?: string): Promise<void> => {
      // Disconnect existing client if any
      if (client) {
        client.disconnect()
      }

      setError(null)
      const newClient = new GatewayClient({
        url,
        token,
        onConnect: () => {
          setConnected(true)
        },
        onDisconnect: () => {
          setConnected(false)
          setHealth(null)
        },
        onError: (err) => {
          setError(err)
        },
      })

      setClient(newClient)

      try {
        await newClient.connect()
        const healthSnapshot = await newClient.health()
        setHealth(healthSnapshot)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        throw err
      }
    },
    [client]
  )

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect()
      setClient(null)
      setConnected(false)
      setHealth(null)
    }
  }, [client])

  // Auto-connect if configured
  useEffect(() => {
    if (autoConnect && defaultUrl && !client) {
      void connect(defaultUrl, defaultToken).catch(() => {
        // Error is already set in state
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, defaultUrl, defaultToken])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      client?.disconnect()
    }
  }, [client])

  const value: GatewayContextValue = {
    client,
    connected,
    health,
    error,
    connect,
    disconnect,
  }

  return <GatewayContext value={value}>{children}</GatewayContext>
}

// Export types and context for external use

export { GatewayContext }
export type { GatewayContextValue }
