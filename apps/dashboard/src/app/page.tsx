"use client"

import { useState, useEffect, useCallback } from "react"
import { Shell, type ViewId } from "@/components/layout"
import { ConnectionDialog } from "@/components/dialogs"
import { CommandPalette } from "@/components/command-palette"
import { ChatView } from "@/components/chat"
import { CLIView } from "@/components/cli"
import { ProcessesView } from "@/components/processes"
import { SkillsView } from "@/components/skills"
import { ConfigView } from "@/components/config"
import { DocumentsView } from "@/components/documents"
import { useGateway } from "@/lib/gateway/hooks"

/**
 * Placeholder view component for development.
 * Shows the view name with a minimal styled container.
 */
function PlaceholderView({ name }: { name: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-mono text-2xl text-foreground tracking-wider mb-2">
          {name.toUpperCase()}
        </h2>
        <p className="text-sm text-muted-foreground">View coming soon</p>
      </div>
    </div>
  )
}

export default function Home() {
  const { connected } = useGateway()

  // Active view state (lifted up to support command palette navigation)
  const [activeView, setActiveView] = useState<ViewId>("chat")

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Connection dialog state - show after 500ms delay when not connected
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)

  useEffect(() => {
    if (!connected) {
      const timer = setTimeout(() => {
        setConnectionDialogOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [connected])

  const handleCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true)
  }, [])

  const handleNavigate = useCallback((view: string) => {
    setActiveView(view as ViewId)
  }, [])

  const renderView = (view: ViewId) => {
    switch (view) {
      case "chat":
        return <ChatView />
      case "cli":
        return <CLIView />
      case "processes":
        return <ProcessesView />
      case "skills":
        return <SkillsView />
      case "config":
        return <ConfigView />
      case "documents":
        return <DocumentsView />
      default:
        return <PlaceholderView name="Unknown" />
    }
  }

  return (
    <>
      <Shell
        activeView={activeView}
        onViewChange={setActiveView}
        connected={connected}
        version="v0.1.0-alpha"
        uptime="--"
        onCommandPalette={handleCommandPalette}
      >
        {renderView}
      </Shell>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleNavigate}
      />

      <ConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
      />
    </>
  )
}
