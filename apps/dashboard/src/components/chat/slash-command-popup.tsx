"use client"

import { useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Command, Lightning } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface SlashCommand {
  name: string
  description: string
  category?: string
}

export interface SlashCommandPopupProps {
  isOpen: boolean
  commands: SlashCommand[]
  filter: string
  selectedIndex: number
  onSelect: (command: SlashCommand) => void
  onClose: () => void
  className?: string
}

/**
 * Popup component that displays available slash commands.
 * Shows when user types "/" in the message input.
 */
export function SlashCommandPopup({
  isOpen,
  commands,
  filter,
  selectedIndex,
  onSelect,
  onClose,
  className,
}: SlashCommandPopupProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Filter commands based on input after the slash
  const filteredCommands = commands.filter((cmd) => {
    const search = filter.toLowerCase()
    return (
      cmd.name.toLowerCase().includes(search) ||
      cmd.description.toLowerCase().includes(search) ||
      cmd.category?.toLowerCase().includes(search)
    )
  })

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [selectedIndex])

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  const handleCommandClick = useCallback(
    (cmd: SlashCommand) => {
      onSelect(cmd)
    },
    [onSelect]
  )

  if (filteredCommands.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={listRef}
          className={cn(
            "absolute bottom-full left-0 right-0 mb-2",
            "max-h-64 overflow-y-auto",
            "bg-zinc-950/95 backdrop-blur-md",
            "border border-zinc-800 rounded-xl",
            "shadow-xl shadow-black/50",
            "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700",
            className
          )}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          {/* Header */}
          <div className="sticky top-0 px-3 py-2 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Command size={12} weight="bold" />
              <span className="font-mono">
                {filteredCommands.length} command{filteredCommands.length !== 1 ? "s" : ""}
              </span>
              {filter && (
                <span className="text-amber-500/70">
                  matching "{filter}"
                </span>
              )}
            </div>
          </div>

          {/* Command list */}
          <div className="p-1">
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.name}
                ref={index === selectedIndex ? selectedRef : undefined}
                onClick={() => handleCommandClick(cmd)}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2 rounded-lg",
                  "text-left transition-colors duration-100",
                  index === selectedIndex
                    ? "bg-amber-500/10 text-foreground"
                    : "text-muted-foreground hover:bg-zinc-800/50 hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5",
                    index === selectedIndex
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  <Lightning size={14} weight="bold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      /{cmd.name}
                    </span>
                    {cmd.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-500 font-mono">
                        {cmd.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 truncate opacity-70">
                    {cmd.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="sticky bottom-0 px-3 py-1.5 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/50">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
              <span>
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">Enter</kbd> select
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">Esc</kbd> close
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
