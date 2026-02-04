"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  ArrowRight,
  ChatCircle,
  Terminal,
  Lightning,
  List,
  Gear,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface Command {
  id: string
  label: string
  description?: string
  icon: PhosphorIcon
  action: () => void
  shortcut?: string
}

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (view: string) => void
}

/**
 * Spotlight-style command palette with keyboard navigation.
 * Features search filtering, arrow key navigation, and shortcut hints.
 */
export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Define available commands
  const commands: Command[] = useMemo(
    () => [
      {
        id: "chat",
        label: "Go to Chat",
        description: "Open the chat interface",
        icon: ChatCircle,
        action: () => onNavigate("chat"),
        shortcut: "G C",
      },
      {
        id: "cli",
        label: "Go to CLI",
        description: "Open the terminal",
        icon: Terminal,
        action: () => onNavigate("cli"),
        shortcut: "G T",
      },
      {
        id: "processes",
        label: "Go to Processes",
        description: "View running processes",
        icon: Lightning,
        action: () => onNavigate("processes"),
        shortcut: "G P",
      },
      {
        id: "skills",
        label: "Go to Skills",
        description: "Browse available skills",
        icon: List,
        action: () => onNavigate("skills"),
        shortcut: "G S",
      },
      {
        id: "config",
        label: "Go to Config",
        description: "Manage configuration",
        icon: Gear,
        action: () => onNavigate("config"),
        shortcut: "G ,",
      },
    ],
    [onNavigate]
  )

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      return commands
    }
    const lowerSearch = search.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerSearch) ||
        cmd.description?.toLowerCase().includes(lowerSearch)
    )
  }, [commands, search])

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSearch("")
      setSelectedIndex(0)
      // Focus input after animation starts
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1))
    }
  }, [filteredCommands.length, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const selectedEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex, filteredCommands.length])

  // Execute selected command
  const executeCommand = useCallback(
    (command: Command) => {
      command.action()
      onOpenChange(false)
    },
    [onOpenChange]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          event.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case "Enter":
          event.preventDefault()
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex])
          }
          break
        case "Escape":
          event.preventDefault()
          onOpenChange(false)
          break
      }
    },
    [filteredCommands, selectedIndex, executeCommand, onOpenChange]
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-center"
          style={{ paddingTop: "20vh" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Command palette modal */}
          <motion.div
            className={cn(
              "relative w-full max-w-lg mx-4",
              "bg-zinc-950 border border-border rounded-xl",
              "shadow-2xl shadow-black/50",
              "overflow-hidden"
            )}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onKeyDown={handleKeyDown}
          >
            {/* Accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <MagnifyingGlass
                size={20}
                className="text-muted-foreground flex-shrink-0"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commands..."
                className={cn(
                  "flex-1 bg-transparent text-foreground",
                  "font-mono text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none"
                )}
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-border text-xs font-mono text-muted-foreground">
                esc
              </kbd>
            </div>

            {/* Command list */}
            <div
              ref={listRef}
              className="max-h-80 overflow-y-auto py-2"
              role="listbox"
            >
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No commands found
                </div>
              ) : (
                filteredCommands.map((command, index) => (
                  <CommandItem
                    key={command.id}
                    command={command}
                    selected={index === selectedIndex}
                    index={index}
                    onClick={() => executeCommand(command)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  />
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-zinc-950/50">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-border font-mono">
                    ↑↓
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-border font-mono">
                    ↵
                  </kbd>
                  select
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface CommandItemProps {
  command: Command
  selected: boolean
  index: number
  onClick: () => void
  onMouseEnter: () => void
}

function CommandItem({
  command,
  selected,
  index,
  onClick,
  onMouseEnter,
}: CommandItemProps) {
  const Icon = command.icon

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-index={index}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5",
        "text-left transition-colors",
        selected
          ? "bg-amber-500/10 text-foreground"
          : "text-muted-foreground hover:bg-zinc-900/50"
      )}
    >
      <Icon
        size={18}
        weight={selected ? "fill" : "regular"}
        className={cn(
          "flex-shrink-0 transition-colors",
          selected && "text-amber-500"
        )}
      />

      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm truncate">{command.label}</div>
        {command.description && (
          <div className="text-xs text-muted-foreground truncate">
            {command.description}
          </div>
        )}
      </div>

      {command.shortcut && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {command.shortcut.split(" ").map((key, i) => (
            <kbd
              key={i}
              className={cn(
                "px-1.5 py-0.5 rounded text-xs font-mono",
                "bg-zinc-900 border border-border",
                selected ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {key}
            </kbd>
          ))}
        </div>
      )}

      <ArrowRight
        size={14}
        className={cn(
          "flex-shrink-0 transition-colors",
          selected ? "text-amber-500" : "text-muted-foreground/50"
        )}
      />
    </button>
  )
}
