"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { User, Robot } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { formatTimestamp } from "@/lib/utils"

export interface MessageBubbleProps {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  isStreaming?: boolean
  className?: string
}

/**
 * Single message bubble with role-based styling.
 * User messages are right-aligned with amber background.
 * Assistant messages are left-aligned with dark muted background.
 */
export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ role, content, timestamp, isStreaming = false, className }, ref) => {
    const isUser = role === "user"

    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser
              ? "bg-amber-500/20 text-amber-500"
              : "bg-zinc-800 text-zinc-400"
          )}
        >
          {isUser ? <User size={16} weight="bold" /> : <Robot size={16} weight="bold" />}
        </div>

        {/* Message content */}
        <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
          <div
            className={cn(
              "max-w-[80%] px-4 py-2.5 text-sm leading-relaxed",
              "shadow-lg",
              isUser
                ? "bg-amber-500 text-black rounded-2xl rounded-br-md"
                : "bg-zinc-900 text-white border border-zinc-800 rounded-2xl rounded-bl-md"
            )}
          >
            <p className="whitespace-pre-wrap break-words">{content}</p>
            {/* Streaming cursor indicator */}
            {isStreaming && (
              <span className="inline-flex ml-1">
                <StreamingCursor />
              </span>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-muted-foreground font-mono px-1">
            {formatTimestamp(timestamp)}
          </span>
        </div>
      </motion.div>
    )
  }
)

MessageBubble.displayName = "MessageBubble"

/**
 * Animated streaming cursor indicator with pulsing dots.
 */
function StreamingCursor() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current opacity-60"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  )
}
