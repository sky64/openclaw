"use client"

import { useCallback, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Robot, PlugsConnected, X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useGateway, useChat } from "@/lib/gateway/hooks"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import type { ChatMessage } from "@/lib/gateway/types"

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

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)

  const handleSend = useCallback(
    async (text: string) => {
      try {
        // TODO: Include replyingTo in the send request when backend supports it
        await send(text)
        setReplyingTo(null) // Clear reply after sending
      } catch {
        // Error is handled in the hook
      }
    },
    [send]
  )

  const handleStop = useCallback(async () => {
    await abort()
  }, [abort])

  // Handle inline button clicks - send the callback_data as a message
  const handleButtonClick = useCallback(
    async (callbackData: string) => {
      try {
        await send(callbackData)
      } catch {
        // Error is handled in the hook
      }
    },
    [send]
  )

  // Handle reply selection
  const handleReplySelect = useCallback((message: ChatMessage) => {
    setReplyingTo(message)
  }, [])

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
        onButtonClick={handleButtonClick}
        onReplySelect={handleReplySelect}
        className="flex-1 min-h-0"
      />

      {/* Reply preview bar */}
      {replyingTo && (
        <motion.div
          className="mx-4 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-t-lg flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-500 font-medium">
              Replying to {replyingTo.role === "user" ? "yourself" : "Sky64"}
            </p>
            <p className="text-xs text-zinc-400 truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 ml-2"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Input area */}
      <MessageInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={!connected}
        streaming={streaming}
        placeholder={replyingTo ? "Reply..." : "Message Sky64..."}
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
