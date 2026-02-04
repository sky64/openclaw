"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lightning, Plus, PlugsConnected, Spinner } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useGateway, useGatewayEvent } from "@/lib/gateway/hooks"
import { Button } from "@/components/ui/button"
import { ProcessCard, type Process } from "./process-card"

export interface ProcessesViewProps {
  className?: string
}

/**
 * Mock processes data for initial development.
 * Will be replaced with real agent tracking data.
 */
const mockProcesses: Process[] = [
  {
    id: "1",
    name: "Main Agent Session",
    status: "running",
    startedAt: Date.now() - 300000,
    progress: 45,
  },
  {
    id: "2",
    name: "Telegram Bot",
    status: "completed",
    startedAt: Date.now() - 600000,
    completedAt: Date.now() - 500000,
  },
  {
    id: "3",
    name: "Cron: Daily Backup",
    status: "pending",
    startedAt: Date.now(),
  },
  {
    id: "4",
    name: "Discord Integration",
    status: "running",
    startedAt: Date.now() - 180000,
    progress: 72,
  },
  {
    id: "5",
    name: "API Health Check",
    status: "failed",
    startedAt: Date.now() - 900000,
    completedAt: Date.now() - 850000,
    error: "Connection timeout after 30s. Unable to reach upstream server.",
  },
  {
    id: "6",
    name: "Message Queue Worker",
    status: "completed",
    startedAt: Date.now() - 1200000,
    completedAt: Date.now() - 1100000,
  },
]

/**
 * Main processes view component.
 * Displays a grid of process cards with real-time status updates.
 */
export function ProcessesView({ className }: ProcessesViewProps) {
  const { connected } = useGateway()
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)

  // Load initial processes data
  useEffect(() => {
    if (!connected) {
      setProcesses([])
      setLoading(false)
      return
    }

    // Simulate loading delay, then show mock data
    const timer = setTimeout(() => {
      setProcesses(mockProcesses)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [connected])

  // Subscribe to agent events for real-time updates
  const handleAgentEvent = useCallback((event: { payload?: unknown }) => {
    // Handle real agent events when available
    // For now, this is a placeholder for future integration
    const payload = event.payload as {
      type?: string
      processId?: string
      status?: Process["status"]
      progress?: number
    } | undefined

    if (payload?.type === "process_update" && payload.processId) {
      setProcesses((prev) =>
        prev.map((p) =>
          p.id === payload.processId
            ? {
                ...p,
                status: payload.status ?? p.status,
                progress: payload.progress ?? p.progress,
              }
            : p
        )
      )
    }
  }, [])

  useGatewayEvent("agent", handleAgentEvent)

  // Not connected state
  if (!connected) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <ProcessesHeader onNewAgent={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-4 text-muted-foreground p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <PlugsConnected size={40} className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Not Connected
              </p>
              <p className="text-xs mt-1 max-w-[240px]">
                Connect to the gateway to view running processes
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <ProcessesHeader onNewAgent={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-4 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Spinner size={32} className="text-amber-500" />
            </motion.div>
            <p className="text-sm font-mono text-muted-foreground">
              Loading processes...
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // Empty state
  if (processes.length === 0) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <ProcessesHeader onNewAgent={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-4 text-muted-foreground p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Lightning size={40} weight="duotone" className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No Active Processes
              </p>
              <p className="text-xs mt-1 max-w-[240px]">
                Start a new agent or wait for scheduled tasks to begin
              </p>
            </div>
            <Button variant="default" size="sm" className="mt-2">
              <Plus size={16} className="mr-1.5" />
              New Agent
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ProcessesHeader onNewAgent={() => {}} processCount={processes.length} />

      {/* Process grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          <AnimatePresence mode="popLayout">
            {processes.map((process) => (
              <motion.div
                key={process.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <ProcessCard process={process} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Header component for the processes view.
 */
function ProcessesHeader({
  onNewAgent,
  processCount,
}: {
  onNewAgent: () => void
  processCount?: number
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Lightning size={18} weight="duotone" className="text-amber-500" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">Processes</h2>
          <p className="text-[10px] text-muted-foreground font-mono">
            {processCount !== undefined
              ? `${processCount} active`
              : "Agent management"}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onNewAgent}>
        <Plus size={14} className="mr-1.5" />
        New Agent
      </Button>
    </div>
  )
}
