"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Gear, PlugsConnected, Shield, Wrench } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useGateway } from "@/lib/gateway/hooks"
import { ConfigSection, ConfigField } from "./config-section"

export interface ConfigViewProps {
  className?: string
}

/**
 * Format uptime from milliseconds to human-readable string.
 */
function formatUptime(uptimeMs: number): string {
  const totalSeconds = Math.floor(uptimeMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(" ")
}

/**
 * Main configuration view component.
 * Displays gateway settings in collapsible sections.
 */
export function ConfigView({ className }: ConfigViewProps) {
  const { client, connected, health } = useGateway()
  const [fullConfig, setFullConfig] = useState<Record<string, unknown> | null>(
    null
  )
  const [configLoading, setConfigLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  // Fetch full config when connected
  const fetchConfig = useCallback(async () => {
    if (!client || !connected) {
      return
    }

    setConfigLoading(true)
    setConfigError(null)

    try {
      const config = await client.configGet<Record<string, unknown>>()
      setFullConfig(config)
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : "Failed to load config")
    } finally {
      setConfigLoading(false)
    }
  }, [client, connected])

  useEffect(() => {
    void fetchConfig()
  }, [fetchConfig])

  // Not connected state
  if (!connected) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <ConfigHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <NotConnectedState />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ConfigHeader />

      <div className="flex-1 overflow-y-auto p-4">
        <motion.div
          className="space-y-4 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Gateway Section */}
          <GatewaySection health={health} />

          {/* Channels Section */}
          <ChannelsSection health={health} />

          {/* Security Section */}
          <SecuritySection />

          {/* Advanced Section */}
          <AdvancedSection
            config={fullConfig}
            loading={configLoading}
            error={configError}
          />
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Header component for the config view.
 */
function ConfigHeader() {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Gear size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">Configuration</h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              Gateway settings and status
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Not connected state component.
 */
function NotConnectedState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-muted-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Gear size={40} weight="duotone" className="text-zinc-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Not Connected</p>
        <p className="text-xs mt-1 max-w-[280px]">
          Connect to a gateway to view configuration settings.
        </p>
      </div>
    </motion.div>
  )
}

interface GatewaySectionProps {
  health: {
    ok: boolean
    uptime: number
    version: string
    channels: Record<string, { connected: boolean; error?: string }>
  } | null
}

/**
 * Gateway info section.
 */
function GatewaySection({ health }: GatewaySectionProps) {
  return (
    <ConfigSection title="Gateway" defaultOpen>
      <ConfigField label="Version" description="Current gateway version">
        <span className="font-mono text-sm text-foreground">
          {health?.version ?? "Unknown"}
        </span>
      </ConfigField>

      <ConfigField label="Uptime" description="Time since gateway started">
        <span className="font-mono text-sm text-foreground">
          {health?.uptime != null ? formatUptime(health.uptime) : "--"}
        </span>
      </ConfigField>

      <ConfigField label="Status" description="Gateway health status">
        <Badge variant={health?.ok ? "success" : "error"}>
          {health?.ok ? "Healthy" : "Unhealthy"}
        </Badge>
      </ConfigField>
    </ConfigSection>
  )
}

interface ChannelsSectionProps {
  health: {
    ok: boolean
    uptime: number
    version: string
    channels: Record<string, { connected: boolean; error?: string }>
  } | null
}

/**
 * Channels status section.
 */
function ChannelsSection({ health }: ChannelsSectionProps) {
  const channels = health?.channels ?? {}
  const channelEntries = Object.entries(channels)

  return (
    <ConfigSection title="Channels" defaultOpen>
      {channelEntries.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">
          No channels configured
        </div>
      ) : (
        channelEntries.map(([name, status]) => (
          <ConfigField
            key={name}
            label={name}
            description={status.error ?? undefined}
          >
            <Badge variant={status.connected ? "success" : "error"}>
              {status.connected ? "Connected" : "Disconnected"}
            </Badge>
          </ConfigField>
        ))
      )}
    </ConfigSection>
  )
}

/**
 * Security settings section.
 */
function SecuritySection() {
  return (
    <ConfigSection title="Security" defaultOpen={false}>
      <ConfigField
        label="Rate Limiting"
        description="Protects against excessive requests"
      >
        <Badge variant="success">Enabled</Badge>
      </ConfigField>

      <ConfigField
        label="Audit Logging"
        description="Records all gateway operations"
      >
        <Badge variant="success">Enabled</Badge>
      </ConfigField>
    </ConfigSection>
  )
}

interface AdvancedSectionProps {
  config: Record<string, unknown> | null
  loading: boolean
  error: string | null
}

/**
 * Advanced section with raw JSON config display.
 */
function AdvancedSection({ config, loading, error }: AdvancedSectionProps) {
  return (
    <ConfigSection title="Advanced" defaultOpen={false}>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Raw configuration data from the gateway
        </p>

        {loading && (
          <div className="text-sm text-muted-foreground py-4 text-center">
            Loading configuration...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 py-4 text-center">{error}</div>
        )}

        {!loading && !error && config && (
          <div
            className={cn(
              "rounded-lg overflow-hidden",
              "bg-black/50 border border-zinc-800",
              "p-4"
            )}
          >
            <pre className="font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        )}

        {!loading && !error && !config && (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No configuration data available
          </div>
        )}
      </div>
    </ConfigSection>
  )
}
