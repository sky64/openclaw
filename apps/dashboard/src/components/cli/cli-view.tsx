"use client"

import { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Terminal as TerminalIcon, PlugsConnected } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useGateway } from "@/lib/gateway/hooks"
import { Terminal, type TerminalLine } from "./terminal"
import { InputPanel } from "./input-panel"
import { OutputPanel } from "./output-panel"

/**
 * CLI View component props.
 */
export interface CLIViewProps {
  className?: string
}

/**
 * Main CLI view with dual-pane layout.
 * Left/Top: InputPanel for multi-line command editing
 * Right/Bottom: OutputPanel for command output display
 * Bottom: Quick command input using minimal Terminal
 */
export function CLIView({ className }: CLIViewProps) {
  const { connected, client, health } = useGateway()
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    {
      id: "welcome-1",
      type: "output",
      content: "SKY64 TERMINAL v0.1.0",
      timestamp: Date.now(),
    },
    {
      id: "welcome-2",
      type: "output",
      content: 'Type "help" for available commands.',
      timestamp: Date.now(),
    },
    {
      id: "welcome-3",
      type: "output",
      content: "",
      timestamp: Date.now(),
    },
  ])

  // Generate unique line ID
  const generateId = useCallback(() => {
    return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }, [])

  // Add a line to the terminal
  const addLine = useCallback(
    (type: TerminalLine["type"], content: string) => {
      const newLine: TerminalLine = {
        id: generateId(),
        type,
        content,
        timestamp: Date.now(),
      }
      setLines((prev) => [...prev, newLine])
    },
    [generateId]
  )

  // Add multiple output lines
  const addOutput = useCallback(
    (content: string | string[]) => {
      const contentArray = Array.isArray(content) ? content : [content]
      setLines((prev) => [
        ...prev,
        ...contentArray.map((line) => ({
          id: generateId(),
          type: "output" as const,
          content: line,
          timestamp: Date.now(),
        })),
      ])
    },
    [generateId]
  )

  // Add error line
  const addError = useCallback(
    (message: string) => {
      addLine("error", `Error: ${message}`)
    },
    [addLine]
  )

  // Clear all output lines
  const handleClearOutput = useCallback(() => {
    setLines([])
  }, [])

  // Format uptime from milliseconds
  const formatUptime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }, [])

  // Command handlers
  const commands = useMemo(
    () => ({
      help: () => {
        addOutput([
          "Available commands:",
          "",
          "  help       Show this help message",
          "  status     Show gateway health status",
          "  channels   List channel statuses",
          "  sessions   List recent sessions",
          "  logs [n]   Show last n log entries (default: 20)",
          "  config     Show current configuration",
          "  clear      Clear terminal output",
          "",
        ])
      },

      clear: () => {
        setLines([])
      },

      status: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }

        try {
          const healthData = await client.health()
          addOutput([
            "Gateway Status:",
            "",
            `  Status:   ${healthData.ok ? "OK" : "DEGRADED"}`,
            `  Version:  ${healthData.version}`,
            `  Uptime:   ${formatUptime(healthData.uptime)}`,
            "",
          ])
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get status")
        }
      },

      channels: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }

        try {
          const result = await client.channelsStatus()
          const outputLines = ["Channel Status:", ""]

          for (const channelId of result.channelOrder) {
            const label = result.channelLabels[channelId] ?? channelId
            const accounts = result.channelAccounts[channelId] ?? []

            if (accounts.length === 0) {
              outputLines.push(`  ${label}: not configured`)
            } else {
              for (const account of accounts) {
                const status = account.connected
                  ? "CONNECTED"
                  : account.enabled
                    ? "DISCONNECTED"
                    : "DISABLED"
                const statusColor =
                  status === "CONNECTED"
                    ? status
                    : status === "DISCONNECTED"
                      ? status
                      : status
                outputLines.push(`  ${label}: ${statusColor}`)
                if (account.lastError) {
                  outputLines.push(`    Error: ${account.lastError}`)
                }
              }
            }
          }

          outputLines.push("")
          addOutput(outputLines)
        } catch (err) {
          addError(
            err instanceof Error ? err.message : "Failed to get channel status"
          )
        }
      },

      sessions: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }

        try {
          const sessions = await client.sessionsList({
            limit: 10,
            includeDerivedTitles: true,
            includeLastMessage: true,
          })
          const outputLines = ["Recent Sessions:", ""]

          if (sessions.length === 0) {
            outputLines.push("  No sessions found")
          } else {
            for (const session of sessions) {
              const title = session.title ?? session.key
              const date = new Date(session.updatedAt).toLocaleDateString()
              outputLines.push(`  ${title}`)
              outputLines.push(`    Last active: ${date}`)
              outputLines.push(`    Messages: ${session.messageCount}`)
              if (session.lastMessage) {
                const preview =
                  session.lastMessage.length > 50
                    ? session.lastMessage.slice(0, 50) + "..."
                    : session.lastMessage
                outputLines.push(`    Last: "${preview}"`)
              }
              outputLines.push("")
            }
          }

          addOutput(outputLines)
        } catch (err) {
          addError(
            err instanceof Error ? err.message : "Failed to get sessions"
          )
        }
      },

      logs: async (args: string[]) => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }

        const limit = parseInt(args[0] ?? "20", 10)
        if (isNaN(limit) || limit < 1) {
          addError("Invalid limit. Usage: logs [n]")
          return
        }

        try {
          const result = await client.logsTail({ limit })
          const outputLines = [`Last ${limit} log entries:`, ""]

          if (result.lines.length === 0) {
            outputLines.push("  No logs available")
          } else {
            for (const line of result.lines) {
              outputLines.push(`  ${line}`)
            }
          }

          if (result.truncated) {
            outputLines.push("  ... (truncated)")
          }

          outputLines.push("")
          addOutput(outputLines)
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get logs")
        }
      },

      config: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }

        try {
          const config = await client.configGet<Record<string, unknown>>()
          const outputLines = ["Current Configuration:", ""]

          // Format config as readable output
          const formatValue = (value: unknown, indent = 2): string[] => {
            const lines: string[] = []
            const padding = " ".repeat(indent)

            if (typeof value === "object" && value !== null) {
              for (const [key, val] of Object.entries(value)) {
                if (typeof val === "object" && val !== null) {
                  lines.push(`${padding}${key}:`)
                  lines.push(...formatValue(val, indent + 2))
                } else {
                  lines.push(`${padding}${key}: ${String(val)}`)
                }
              }
            } else {
              lines.push(`${padding}${String(value)}`)
            }

            return lines
          }

          outputLines.push(...formatValue(config))
          outputLines.push("")
          addOutput(outputLines)
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get config")
        }
      },
    }),
    [connected, client, addOutput, addError, formatUptime]
  )

  // Handle command execution
  const handleCommand = useCallback(
    async (commandLine: string) => {
      // Echo the command
      addLine("input", commandLine)

      const parts = commandLine.trim().split(/\s+/)
      const cmd = parts[0]?.toLowerCase()
      const args = parts.slice(1)

      if (!cmd) {
        return
      }

      // Check if command exists
      if (cmd in commands) {
        const handler = commands[cmd as keyof typeof commands]
        if (cmd === "logs") {
          await (handler as (args: string[]) => Promise<void>)(args)
        } else {
          await (handler as () => void | Promise<void>)()
        }
      } else {
        addError(`Unknown command: ${cmd}. Type "help" for available commands.`)
      }
    },
    [commands, addLine, addError]
  )

  // Not connected state
  if (!connected) {
    return (
      <div className={cn("h-full flex flex-col gap-5 p-5", className)}>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-wide">CLI Playground</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/20">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-xs font-medium text-zinc-500">Disconnected</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[var(--surface-1)] rounded-2xl border border-[var(--surface-1-border)]">
          <motion.div
            className="flex flex-col items-center gap-5 text-muted-foreground p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-24 h-24 rounded-2xl bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
              <PlugsConnected size={48} className="text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Connection Required</p>
              <p className="text-sm mt-2 max-w-[300px] text-muted-foreground">
                Connect to the gateway to access the CLI playground
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col gap-5 p-5", className)}>
      <CLIHeader version={health?.version} uptime={health?.uptime} />

      {/* Dual Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* Input Panel - Left on desktop, Top on mobile */}
        <InputPanel
          onRun={handleCommand}
          disabled={!connected}
          className="flex-1 min-h-[250px] lg:min-h-0"
        />

        {/* Output Panel - Right on desktop, Bottom on mobile */}
        <OutputPanel
          lines={lines}
          onClear={handleClearOutput}
          className="flex-1 min-h-[250px] lg:min-h-0"
        />
      </div>

      {/* Quick Command Input */}
      <div className="flex-shrink-0">
        <Terminal
          lines={[]}
          onCommand={handleCommand}
          prompt="sky64>"
          disabled={!connected}
          className="h-16 rounded-2xl text-base"
          minimal
        />
      </div>
    </div>
  )
}

/**
 * CLI view header with terminal branding.
 */
function CLIHeader({
  version,
  uptime,
}: {
  version?: string
  uptime?: number
}) {
  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-wide">CLI Playground</h1>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-500">Connected</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {version && (
          <span className="font-mono">{version}</span>
        )}
        {uptime !== undefined && (
          <span className="font-mono">
            Uptime: {formatUptime(uptime)}
          </span>
        )}
      </div>
    </div>
  )
}
