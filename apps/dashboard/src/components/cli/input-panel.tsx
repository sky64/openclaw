"use client"

import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Play, Eraser } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface InputPanelProps {
  onRun: (command: string) => void
  disabled?: boolean
  className?: string
}

export function InputPanel({ onRun, disabled = false, className }: InputPanelProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleRun = useCallback(() => {
    if (!value.trim() || disabled) return
    onRun(value.trim())
  }, [value, disabled, onRun])

  const handleClear = useCallback(() => {
    setValue("")
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl + Enter to run
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleRun()
      }
    },
    [handleRun]
  )

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-[var(--surface-2)] rounded-xl border border-[var(--surface-2-border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-2-border)]">
        <h3 className="text-sm font-medium">Input</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={!value}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              "bg-[var(--surface-3)] border border-[var(--surface-3-border)]",
              "hover:bg-[var(--muted)] transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Eraser size={14} className="inline mr-1" />
            Clear
          </button>
          <motion.button
            type="button"
            onClick={handleRun}
            disabled={!value.trim() || disabled}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium",
              "bg-amber-500 text-black",
              "hover:bg-amber-400 hover:-translate-y-0.5",
              "transition-all shadow-lg shadow-amber-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={14} weight="fill" className="inline mr-1" />
            Run
          </motion.button>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter commands here...&#10;&#10;Use Cmd+Enter to run"
          disabled={disabled}
          className={cn(
            "w-full h-full resize-none",
            "bg-transparent text-sm font-mono",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:opacity-50"
          )}
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-[var(--surface-2-border)]">
        <p className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--surface-3-border)] font-mono">
            ⌘↵
          </kbd>
          {" "}to run
        </p>
      </div>
    </div>
  )
}
