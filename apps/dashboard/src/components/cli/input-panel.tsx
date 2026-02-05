"use client"

import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Play, Eraser, Code } from "@phosphor-icons/react"
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
        "bg-[var(--surface-2)] rounded-2xl border border-[var(--surface-2-border)]",
        "shadow-lg shadow-black/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-2-border)] bg-[var(--surface-1)]/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Code size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-wide">Task Script</h3>
            <p className="text-xs text-muted-foreground">.ts or .js</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={!value}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium",
              "bg-[var(--surface-3)] border border-[var(--surface-3-border)]",
              "hover:bg-[var(--muted)] transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Eraser size={16} className="inline mr-1.5" />
            Clear
          </button>
          <motion.button
            type="button"
            onClick={handleRun}
            disabled={!value.trim() || disabled}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-semibold",
              "bg-amber-500 text-black",
              "hover:bg-amber-400 hover:-translate-y-0.5",
              "transition-all shadow-lg shadow-amber-500/25",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={16} weight="fill" className="inline mr-1.5" />
            Run
          </motion.button>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter commands here...&#10;&#10;Use Cmd+Enter to run"
          disabled={disabled}
          className={cn(
            "w-full h-full resize-none",
            "bg-transparent text-base font-mono leading-relaxed",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none",
            "disabled:opacity-50"
          )}
        />
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 border-t border-[var(--surface-2-border)] bg-[var(--surface-1)]/30 rounded-b-2xl">
        <p className="text-sm text-muted-foreground">
          <kbd className="px-1.5 py-1 rounded-lg bg-[var(--surface-3)] border border-[var(--surface-3-border)] font-mono text-xs">
            ⌘↵
          </kbd>
          <span className="ml-2">to run</span>
        </p>
      </div>
    </div>
  )
}
