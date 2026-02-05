"use client"

import { motion } from "framer-motion"
import { List, MagnifyingGlass, Hexagon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui"

interface HeaderProps {
  onMenuClick?: () => void
  onCommandPalette?: () => void
  className?: string
}

export function Header({ onMenuClick, onCommandPalette, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between px-4",
        "bg-[var(--surface-1)] border-b border-[var(--surface-1-border)]",
        "sticky top-0 z-30",
        className
      )}
    >
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            "md:hidden w-9 h-9 rounded-lg flex items-center justify-center",
            "hover:bg-[var(--surface-2)] transition-colors"
          )}
          aria-label="Open menu"
        >
          <List size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <Hexagon size={20} weight="duotone" className="text-amber-500" />
          </motion.div>
          <span className="font-semibold text-lg hidden sm:block">SKY64</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        type="button"
        onClick={onCommandPalette}
        className={cn(
          "hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
          "text-sm text-muted-foreground",
          "hover:bg-[var(--surface-3)] hover:text-foreground",
          "transition-colors"
        )}
      >
        <MagnifyingGlass size={16} />
        <span>Search...</span>
        <kbd className="ml-4 px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--surface-3-border)] text-xs font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right: Theme Toggle */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
