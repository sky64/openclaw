"use client"

import { useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CaretDown, CaretRight } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export interface ConfigSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

/**
 * Collapsible configuration section with animated expand/collapse.
 * Uses Card styling with clickable header.
 */
export function ConfigSection({
  title,
  children,
  defaultOpen = false,
  className,
}: ConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className={cn("overflow-hidden", className)} accentPosition="left">
      {/* Clickable header */}
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-3 p-4",
          "text-left",
          "hover:bg-zinc-900/50 transition-colors duration-200",
          "focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:ring-inset"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {/* Caret icon with rotation animation */}
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="text-amber-500"
        >
          <CaretDown size={16} weight="bold" />
        </motion.span>

        {/* Section title */}
        <span className="font-mono text-sm font-medium tracking-wide text-foreground uppercase">
          {title}
        </span>
      </button>

      {/* Animated content container */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/30">
              <div className="pt-3 space-y-3">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export interface ConfigFieldProps {
  label: string
  description?: string
  children: ReactNode
  className?: string
}

/**
 * Config field with label on left and value/control on right.
 * Supports optional description below label.
 */
export function ConfigField({
  label,
  description,
  children,
  className,
}: ConfigFieldProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-2",
        "border-b border-border/20 last:border-b-0",
        className
      )}
    >
      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Value/control */}
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}
