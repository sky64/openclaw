"use client"

import { useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChatCircleDots, SpinnerGap } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { MessageBubble } from "./message-bubble"
import type { ChatMessage } from "@/lib/gateway/types"

export interface MessageListProps {
  messages: ChatMessage[]
  loading?: boolean
  streaming?: boolean
  className?: string
}

/**
 * Scrollable message container with auto-scroll and animations.
 * Shows empty state when no messages, loading state while fetching history.
 */
export function MessageList({
  messages,
  loading = false,
  streaming = false,
  className,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <motion.div
          className="flex flex-col items-center gap-3 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <SpinnerGap size={32} className="animate-spin" />
          <span className="text-sm font-mono">Loading messages...</span>
        </motion.div>
      </div>
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <motion.div
          className="flex flex-col items-center gap-4 text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <ChatCircleDots size={32} className="text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation with Sky64</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800",
        className
      )}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1
            const isStreamingMessage =
              streaming &&
              isLastMessage &&
              message.role === "assistant" &&
              message.id.startsWith("streaming-")

            return (
              <MessageBubble
                key={message.id || `msg-${index}`}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                isStreaming={isStreamingMessage}
              />
            )
          })}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
