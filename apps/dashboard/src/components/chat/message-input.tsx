"use client"

import { useState, useRef, useCallback, useMemo, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { PaperPlaneRight, Stop } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { SlashCommandPopup, type SlashCommand } from "./slash-command-popup"
import { useCommands } from "@/lib/gateway/hooks"

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
  const [showSlashPopup, setShowSlashPopup] = useState(false)
  const [slashFilter, setSlashFilter] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get real commands from the gateway
  const { commands: slashCommands } = useCommands()

  // Filter commands based on current input
  const filteredCommands = useMemo(() => {
    const search = slashFilter.toLowerCase()
    return slashCommands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(search) ||
        cmd.description.toLowerCase().includes(search)
    )
  }, [slashCommands, slashFilter])

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
    const newValue = e.target.value
    setValue(newValue)
    adjustHeight()

    // Check if user is typing a slash command
    if (newValue.startsWith("/")) {
      const afterSlash = newValue.slice(1)
      // Only show popup if there's no space (still typing the command name)
      if (!afterSlash.includes(" ")) {
        setSlashFilter(afterSlash)
        setShowSlashPopup(true)
        setSelectedIndex(0)
      } else {
        setShowSlashPopup(false)
      }
    } else {
      setShowSlashPopup(false)
      setSlashFilter("")
    }
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
    // Handle slash command popup navigation
    if (showSlashPopup && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const selectedCommand = filteredCommands[selectedIndex]
        if (selectedCommand) {
          handleSlashSelect(selectedCommand)
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowSlashPopup(false)
        return
      }
      if (e.key === "Tab") {
        e.preventDefault()
        const selectedCommand = filteredCommands[selectedIndex]
        if (selectedCommand) {
          handleSlashSelect(selectedCommand)
        }
        return
      }
    }

    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStop = useCallback(() => {
    onStop?.()
  }, [onStop])

  const handleSlashSelect = useCallback((command: SlashCommand) => {
    // Replace the current slash input with the selected command
    setValue(`/${command.name} `)
    setShowSlashPopup(false)
    setSlashFilter("")
    setSelectedIndex(0)
    // Focus back on the textarea
    textareaRef.current?.focus()
  }, [])

  const handleSlashClose = useCallback(() => {
    setShowSlashPopup(false)
  }, [])

  return (
    <div
      className={cn(
        "sticky bottom-0 px-4 py-3",
        "bg-gradient-to-t from-black via-black/95 to-transparent",
        className
      )}
    >
      <div className="max-w-3xl mx-auto relative">
        {/* Slash command popup */}
        <SlashCommandPopup
          isOpen={showSlashPopup}
          commands={slashCommands}
          filter={slashFilter}
          selectedIndex={selectedIndex}
          onSelect={handleSlashSelect}
          onClose={handleSlashClose}
        />

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
