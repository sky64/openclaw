"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Eraser, Terminal } from "@phosphor-icons/react"
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
        "bg-zinc-950 rounded-2xl border border-zinc-800",
        "shadow-lg shadow-black/10",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Terminal size={18} weight="duotone" className="text-green-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-wide text-zinc-100">Run Output</h3>
            <p className="text-xs text-zinc-500">Terminal results</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={lines.length === 0}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium",
            "bg-zinc-800 border border-zinc-700",
            "hover:bg-zinc-700 transition-colors text-zinc-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Eraser size={16} className="inline mr-1.5" />
          Clear
        </button>
      </div>

      {/* Output Lines */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 font-mono text-base leading-relaxed"
      >
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <Terminal size={48} weight="duotone" className="mb-3 opacity-50" />
            <p className="text-sm">Output will appear here...</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {lines.map((line, index) => (
              <motion.div
                key={line.id || `line-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-4",
                  line.type === "error" && "text-red-400",
                  line.type === "input" && "text-amber-400",
                  line.type === "output" && "text-zinc-300"
                )}
              >
                <span className="text-zinc-600 text-sm shrink-0 tabular-nums">
                  {formatTimestamp(line.timestamp)}
                </span>
                <span className="whitespace-pre-wrap break-all">
                  {line.type === "input" && (
                    <span className="text-green-500 mr-2">$</span>
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
