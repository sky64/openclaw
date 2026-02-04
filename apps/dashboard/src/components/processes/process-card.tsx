"use client"

import { motion } from "framer-motion"
import {
  CircleNotch,
  CheckCircle,
  XCircle,
  Clock,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge, type BadgeVariant } from "@/components/ui/badge"

/**
 * Process status type representing the state of a process/agent.
 */
export type ProcessStatus = "running" | "completed" | "failed" | "pending"

/**
 * Process data structure representing a single process or agent.
 */
export interface Process {
  id: string
  name: string
  status: ProcessStatus
  startedAt: number
  completedAt?: number
  progress?: number
  error?: string
}

export interface ProcessCardProps {
  process: Process
  className?: string
}

/**
 * Status configuration for visual styling.
 */
const statusConfig: Record<
  ProcessStatus,
  {
    icon: typeof CircleNotch
    iconClassName: string
    badgeVariant: BadgeVariant
    glowClassName: string
    label: string
    spinning?: boolean
  }
> = {
  running: {
    icon: CircleNotch,
    iconClassName: "text-amber-500",
    badgeVariant: "warning",
    glowClassName: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    label: "Running",
    spinning: true,
  },
  completed: {
    icon: CheckCircle,
    iconClassName: "text-emerald-500",
    badgeVariant: "success",
    glowClassName: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    iconClassName: "text-red-500",
    badgeVariant: "error",
    glowClassName: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    label: "Failed",
  },
  pending: {
    icon: Clock,
    iconClassName: "text-zinc-500",
    badgeVariant: "default",
    glowClassName: "",
    label: "Pending",
  },
}

/**
 * Format a relative time string from a timestamp.
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`
  }
  if (minutes > 0) {
    return `${minutes}m ago`
  }
  return "Just now"
}

/**
 * Format duration between two timestamps.
 */
function formatDuration(startedAt: number, completedAt?: number): string {
  const end = completedAt ?? Date.now()
  const diff = end - startedAt
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * A card component displaying a single process/agent status.
 * Features status-colored icons, progress bars, and glow effects.
 */
export function ProcessCard({ process, className }: ProcessCardProps) {
  const config = statusConfig[process.status]
  const Icon = config.icon

  return (
    <Card
      interactive
      className={cn(
        "overflow-hidden transition-shadow duration-300",
        config.glowClassName,
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                "bg-zinc-900 border border-zinc-800"
              )}
            >
              <motion.div
                animate={config.spinning ? { rotate: 360 } : undefined}
                transition={
                  config.spinning
                    ? { duration: 1, repeat: Infinity, ease: "linear" }
                    : undefined
                }
              >
                <Icon size={20} weight="bold" className={config.iconClassName} />
              </motion.div>
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{process.name}</CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Started {formatRelativeTime(process.startedAt)}
              </p>
            </div>
          </div>
          <Badge variant={config.badgeVariant} className="flex-shrink-0">
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress bar for running processes */}
        {process.status === "running" && process.progress !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-amber-500">{process.progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${process.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Error message for failed processes */}
        {process.status === "failed" && process.error && (
          <div className="px-3 py-2 bg-red-950/30 border border-red-900/30 rounded-md mb-3">
            <p className="text-[10px] text-red-400 font-mono line-clamp-2">
              {process.error}
            </p>
          </div>
        )}

        {/* Duration info */}
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>Duration</span>
          <span>
            {formatDuration(process.startedAt, process.completedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
