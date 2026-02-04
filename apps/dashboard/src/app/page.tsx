"use client"

import { useState } from "react"
import { Shell, type ViewId } from "@/components/layout"

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
  // Command palette state will be used when the component is implemented
  const [_commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const handleCommandPalette = () => {
    setCommandPaletteOpen(true)
    // TODO: Open command palette dialog (Task #12)
  }

  const renderView = (activeView: ViewId) => {
    switch (activeView) {
      case "chat":
        return <PlaceholderView name="Chat" />
      case "cli":
        return <PlaceholderView name="CLI Terminal" />
      case "processes":
        return <PlaceholderView name="Processes" />
      case "skills":
        return <PlaceholderView name="Skills" />
      case "config":
        return <PlaceholderView name="Config" />
      default:
        return <PlaceholderView name="Unknown" />
    }
  }

  return (
    <Shell
      defaultView="chat"
      connected={true} // Will be connected to gateway state
      version="v0.1.0-alpha"
      uptime="--"
      onCommandPalette={handleCommandPalette}
    >
      {renderView}
    </Shell>
  )
}
