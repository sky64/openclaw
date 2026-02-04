"use client"

import { useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Robot, PlugsConnected } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useGateway, useChat } from "@/lib/gateway/hooks"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"

export interface ChatViewProps {
  className?: string
}

/**
 * Main chat view component.
 * Combines message list and input with gateway connection state handling.
 */
export function ChatView({ className }: ChatViewProps) {
  const { connected, client } = useGateway()

  // Get session key from gateway HelloOk response (if available)
  const sessionKey = useMemo(() => {
    const helloOk = client?.getHelloOk()
    return helloOk?.snapshot?.sessionDefaults?.mainSessionKey ?? "default"
  }, [client])

  const { messages, loading, streaming, send, abort, error } = useChat(
    connected ? sessionKey : undefined
  )

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await send(text)
      } catch {
        // Error is handled in the hook
      }
    },
    [send]
  )

  const handleStop = useCallback(async () => {
    await abort()
  }, [abort])

  // Not connected state
  if (!connected) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <ChatHeader />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-4 text-muted-foreground p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <PlugsConnected size={40} className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Not Connected
              </p>
              <p className="text-xs mt-1 max-w-[240px]">
                Connect to the gateway to start chatting with Sky64
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ChatHeader />

      {/* Error banner */}
      {error && (
        <motion.div
          className="mx-4 mt-2 px-4 py-2 bg-red-950/50 border border-red-900/50 rounded-lg"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <p className="text-xs text-red-400 font-mono">{error.message}</p>
        </motion.div>
      )}

      {/* Message list */}
      <MessageList
        messages={messages}
        loading={loading}
        streaming={streaming}
        className="flex-1 min-h-0"
      />

      {/* Input area */}
      <MessageInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={!connected}
        streaming={streaming}
        placeholder="Message Sky64..."
      />
    </div>
  )
}

/**
 * Chat view header with title and status.
 */
function ChatHeader() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <Robot size={18} className="text-amber-500" />
      </div>
      <div>
        <h2 className="text-sm font-medium text-foreground">Chat with Sky64</h2>
        <p className="text-[10px] text-muted-foreground font-mono">
          AI Assistant
        </p>
      </div>
    </div>
  )
}
