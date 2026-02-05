"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Eraser } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { TerminalLine } from "./terminal"

/**
 * Format timestamp as HH:MM:SS.
 */
function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

interface OutputPanelProps {
  lines: TerminalLine[]
  onClear: () => void
  className?: string
}

/**
 * CLI output panel displaying terminal lines with timestamps and auto-scroll.
 * Features:
 * - Auto-scroll to bottom when new lines appear
 * - Clear button in header
 * - Monospace font for output
 * - Color-coded lines (amber for input, red for errors)
 * - Timestamp prefix on each line
 * - Empty state message
 */
export function OutputPanel({ lines, onClear, className }: OutputPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when lines change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-[var(--surface-1)] rounded-xl border border-[var(--surface-1-border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-1-border)]">
        <h3 className="text-sm font-medium">Output</h3>
        <button
          type="button"
          onClick={onClear}
          disabled={lines.length === 0}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium",
            "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
            "hover:bg-[var(--surface-3)] transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Eraser size={14} className="inline mr-1" />
          Clear
        </button>
      </div>

      {/* Output Lines */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {lines.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Output will appear here...
          </p>
        ) : (
          <div className="space-y-1">
            {lines.map((line, index) => (
              <motion.div
                key={line.id || `line-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-3",
                  line.type === "error" && "text-red-500",
                  line.type === "input" && "text-amber-500"
                )}
              >
                <span className="text-muted-foreground text-xs shrink-0">
                  {formatTimestamp(line.timestamp)}
                </span>
                <span className="whitespace-pre-wrap break-all">
                  {line.type === "input" && (
                    <span className="text-muted-foreground mr-1">$</span>
                  )}
                  {line.content}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
