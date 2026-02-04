"use client"

import { useState, useRef, useCallback, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { PaperPlaneRight, Stop } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"

export interface MessageInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  disabled?: boolean
  streaming?: boolean
  placeholder?: string
  className?: string
}

/**
 * Message input area with auto-growing textarea.
 * Supports Enter to send, Shift+Enter for newline.
 * Shows stop button when streaming.
 */
export function MessageInput({
  onSend,
  onStop,
  disabled = false,
  streaming = false,
  placeholder = "Type a message...",
  className,
}: MessageInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const maxHeight = 120 // ~4 lines
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    adjustHeight()
  }

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || streaming) {
      return
    }

    onSend(trimmed)
    setValue("")

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, streaming, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStop = useCallback(() => {
    onStop?.()
  }, [onStop])

  return (
    <div
      className={cn(
        "sticky bottom-0 px-4 py-3",
        "bg-gradient-to-t from-black via-black/95 to-transparent",
        className
      )}
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          className={cn(
            "flex items-end gap-2 p-2",
            "bg-zinc-950/80 backdrop-blur-sm",
            "border border-zinc-800 rounded-xl",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
            "focus-within:border-zinc-700",
            "focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.2)]",
            "transition-all duration-200"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent",
              "px-2 py-1.5",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700"
            )}
          />

          {/* Send or Stop button */}
          {streaming ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={handleStop}
              aria-label="Stop generation"
              className="flex-shrink-0"
            >
              <Stop size={18} weight="bold" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              aria-label="Send message"
              className="flex-shrink-0"
            >
              <PaperPlaneRight size={18} weight="bold" />
            </Button>
          )}
        </motion.div>

        {/* Helper text */}
        <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
          {streaming ? (
            <span className="text-amber-500/70">Generating response...</span>
          ) : (
            <span>Press Enter to send, Shift+Enter for new line</span>
          )}
        </p>
      </div>
    </div>
  )
}
