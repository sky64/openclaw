"use client"

import { useState, useEffect } from "react"
import { Shell, type ViewId } from "@/components/layout"
import { ConnectionDialog } from "@/components/dialogs"
import { ChatView } from "@/components/chat"
import { CLIView } from "@/components/cli"
import { ProcessesView } from "@/components/processes"
import { SkillsView } from "@/components/skills"
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

  // Command palette state will be used when the component is implemented
  const [_commandPaletteOpen, setCommandPaletteOpen] = useState(false)

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

  const handleCommandPalette = () => {
    setCommandPaletteOpen(true)
    // TODO: Open command palette dialog (Task #12)
  }

  const renderView = (activeView: ViewId) => {
    switch (activeView) {
      case "chat":
        return <ChatView />
      case "cli":
        return <CLIView />
      case "processes":
        return <ProcessesView />
      case "skills":
        return <SkillsView />
      case "config":
        return <PlaceholderView name="Config" />
      default:
        return <PlaceholderView name="Unknown" />
    }
  }

  return (
    <>
      <Shell
        defaultView="chat"
        connected={connected}
        version="v0.1.0-alpha"
        uptime="--"
        onCommandPalette={handleCommandPalette}
      >
        {renderView}
      </Shell>

      <ConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
      />
    </>
  )
}
