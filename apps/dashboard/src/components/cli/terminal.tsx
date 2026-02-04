"use client"

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
} from "react"
import { cn } from "@/lib/utils"

/**
 * Terminal line data structure.
 */
export interface TerminalLine {
  id: string
  type: "input" | "output" | "error"
  content: string
  timestamp: number
}

/**
 * Terminal component props.
 */
export interface TerminalProps {
  lines: TerminalLine[]
  onCommand: (command: string) => void
  prompt?: string
  disabled?: boolean
  className?: string
}

/**
 * Terminal emulator component with authentic CLI aesthetic.
 * Features command history, auto-scroll, and click-to-focus.
 */
export function Terminal({
  lines,
  onCommand,
  prompt = "sky64>",
  disabled = false,
  className,
}: TerminalProps) {
  const [input, setInput] = useState("")
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  // Focus input on container click
  const handleContainerClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  // Handle keyboard events for command history
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && input.trim()) {
        const command = input.trim()
        onCommand(command)
        setCommandHistory((prev) => [...prev, command])
        setInput("")
        setHistoryIndex(-1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        if (commandHistory.length > 0) {
          const newIndex =
            historyIndex < commandHistory.length - 1
              ? historyIndex + 1
              : historyIndex
          setHistoryIndex(newIndex)
          setInput(commandHistory[commandHistory.length - 1 - newIndex] ?? "")
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setInput(commandHistory[commandHistory.length - 1 - newIndex] ?? "")
        } else if (historyIndex === 0) {
          setHistoryIndex(-1)
          setInput("")
        }
      }
    },
    [input, onCommand, commandHistory, historyIndex]
  )

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn(
        "h-full bg-black overflow-y-auto cursor-text p-4 font-mono text-sm",
        // Subtle scanline effect
        "bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)]",
        "bg-[length:100%_4px]",
        className
      )}
    >
      {/* Terminal output lines */}
      <div className="space-y-1">
        {lines.map((line) => (
          <TerminalLineComponent key={line.id} line={line} prompt={prompt} />
        ))}
      </div>

      {/* Input line */}
      <div className="flex items-center mt-1">
        <span className="text-green-500 mr-2 select-none">{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-green-400",
            "caret-green-500 font-mono text-sm",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {/* Blinking cursor indicator */}
        <span className="w-2 h-4 bg-green-500 animate-pulse ml-0.5" />
      </div>
    </div>
  )
}

/**
 * Renders a single terminal line with appropriate styling.
 */
function TerminalLineComponent({
  line,
  prompt,
}: {
  line: TerminalLine
  prompt: string
}) {
  const getLineClass = () => {
    switch (line.type) {
      case "input":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "output":
      default:
        return "text-zinc-300"
    }
  }

  // Input lines show the prompt
  if (line.type === "input") {
    return (
      <div className="flex">
        <span className="text-green-500 mr-2 select-none">{prompt}</span>
        <span className={getLineClass()}>{line.content}</span>
      </div>
    )
  }

  // Output and error lines - handle multiline content
  return (
    <pre
      className={cn(getLineClass(), "whitespace-pre-wrap break-words")}
    >
      {line.content}
    </pre>
  )
}
