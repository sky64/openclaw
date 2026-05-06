"use client"

import { forwardRef, useCallback, useState } from "react"
import { motion } from "framer-motion"
import { User, Robot, ArrowBendUpLeft, Copy, Check } from "@phosphor-icons/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { cn } from "@/lib/utils"
import { formatTimestamp } from "@/lib/utils"

export interface InlineButton {
  text: string
  callback_data: string
}

export interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

export interface MessageBubbleProps {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  isStreaming?: boolean
  buttons?: InlineButton[][]
  replyTo?: { content: string; role: string }
  reactions?: Reaction[]
  onButtonClick?: (callbackData: string) => void
  onReply?: () => void
  onReact?: (emoji: string) => void
  className?: string
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🤔", "👀", "🎉"]

/**
 * Single message bubble with role-based styling.
 * User messages are right-aligned with amber background.
 * Assistant messages are left-aligned with dark muted background.
 * Supports markdown rendering, inline buttons, and reactions.
 */
export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ role, content, timestamp, isStreaming = false, buttons, replyTo, reactions, onButtonClick, onReply, onReact, className }, ref) => {
    const isUser = role === "user"
    const [copied, setCopied] = useState(false)
    const [showActions, setShowActions] = useState(false)
    const [showReactionPicker, setShowReactionPicker] = useState(false)

    const handleCopy = useCallback(async () => {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }, [content])

    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex gap-3 group",
          isUser ? "flex-row-reverse" : "flex-row",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
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
        <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser ? "items-end" : "items-start")}>
          {/* Reply preview */}
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-1 text-xs text-zinc-400 bg-zinc-800/50 rounded-lg border-l-2 border-amber-500/50">
              <ArrowBendUpLeft size={12} />
              <span className="truncate max-w-[200px]">{replyTo.content}</span>
            </div>
          )}

          <div
            className={cn(
              "px-4 py-2.5 text-sm leading-relaxed",
              "shadow-lg",
              isUser
                ? "bg-amber-500 text-black rounded-2xl rounded-br-md"
                : "bg-zinc-900 text-white border border-zinc-800 rounded-2xl rounded-bl-md"
            )}
          >
            {/* Markdown rendered content — rehype-sanitize strips unsafe HTML */}
            <div className={cn(
              "prose prose-sm max-w-none break-words",
              isUser ? "prose-invert-user" : "prose-invert",
              "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
              "[&_pre]:bg-zinc-800 [&_pre]:p-2 [&_pre]:rounded-md [&_pre]:overflow-x-auto",
              "[&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs",
              "[&_a]:text-amber-400 [&_a]:underline",
              "[&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5",
              "[&_blockquote]:border-l-2 [&_blockquote]:border-amber-500/50 [&_blockquote]:pl-3 [&_blockquote]:italic"
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {content}
              </ReactMarkdown>
            </div>
            {/* Streaming cursor indicator */}
            {isStreaming && (
              <span className="inline-flex ml-1">
                <StreamingCursor />
              </span>
            )}
          </div>

          {/* Inline buttons */}
          {buttons && buttons.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {buttons.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 flex-wrap">
                  {row.map((button, btnIndex) => (
                    <button
                      key={btnIndex}
                      onClick={() => onButtonClick?.(button.callback_data)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg",
                        "bg-zinc-800 hover:bg-zinc-700 text-white",
                        "border border-zinc-700 hover:border-amber-500/50",
                        "transition-all duration-150",
                        "active:scale-95"
                      )}
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Reactions display */}
          {reactions && reactions.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => onReact?.(reaction.emoji)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full flex items-center gap-1",
                    "transition-all duration-150",
                    reaction.userReacted
                      ? "bg-amber-500/20 border border-amber-500/50"
                      : "bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-zinc-400">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timestamp and actions */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatTimestamp(timestamp)}
            </span>
            
            {/* Action buttons - show on hover */}
            {showActions && (
              <motion.div 
                className="flex items-center gap-1"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Quick reaction picker */}
                {onReact && (
                  <div className="relative">
                    <button
                      onClick={() => setShowReactionPicker(!showReactionPicker)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Add reaction"
                    >
                      😀
                    </button>
                    {showReactionPicker && (
                      <motion.div
                        className="absolute bottom-full mb-1 left-0 flex gap-0.5 p-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-10"
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                      >
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onReact(emoji)
                              setShowReactionPicker(false)
                            }}
                            className="p-1 hover:bg-zinc-800 rounded transition-colors text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="Copy message"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
                {onReply && (
                  <button
                    onClick={onReply}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Reply"
                  >
                    <ArrowBendUpLeft size={12} />
                  </button>
                )}
              </motion.div>
            )}
          </div>
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
