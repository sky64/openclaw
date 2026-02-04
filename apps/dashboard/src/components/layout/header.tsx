"use client"

import { Command, Bell, User } from "@phosphor-icons/react"
import clsx from "clsx"

interface HeaderProps {
  onCommandPalette?: () => void
}

/**
 * Minimal header bar with command palette trigger, notifications, and user icon.
 */
export function Header({ onCommandPalette }: HeaderProps) {
  return (
    <header className="h-12 flex items-center justify-end gap-2 px-4 border-b border-border bg-black/30">
      {/* Command palette button */}
      <button
        onClick={onCommandPalette}
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "bg-zinc-900/50 border border-border",
          "text-muted-foreground hover:text-foreground",
          "transition-colors group"
        )}
      >
        <Command size={14} className="text-muted-foreground" />
        <span className="text-xs font-mono">Command</span>
        <kbd
          className={clsx(
            "hidden sm:inline-flex items-center gap-0.5",
            "px-1.5 py-0.5 rounded text-[10px] font-mono",
            "bg-zinc-800 border border-zinc-700",
            "text-muted-foreground"
          )}
        >
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Notification bell */}
      <button
        className={clsx(
          "p-2 rounded-lg",
          "text-muted-foreground hover:text-foreground hover:bg-zinc-900/50",
          "transition-colors"
        )}
      >
        <Bell size={18} />
      </button>

      {/* User icon */}
      <button
        className={clsx(
          "p-2 rounded-lg",
          "text-muted-foreground hover:text-foreground hover:bg-zinc-900/50",
          "transition-colors"
        )}
      >
        <User size={18} />
      </button>
    </header>
  )
}
