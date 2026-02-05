"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { Sidebar, type ViewId } from "./sidebar"
import { Header } from "./header"
import { MobileNav } from "./mobile-nav"

interface ShellProps {
  children: (activeView: ViewId) => ReactNode
  defaultView?: ViewId
  activeView?: ViewId
  onViewChange?: (view: ViewId) => void
  connected?: boolean
  version?: string
  uptime?: string
  onCommandPalette?: () => void
}

/**
 * Main shell component that orchestrates the layout.
 * Provides sidebar navigation, header, and content area.
 * Handles keyboard shortcuts for command palette.
 */
export function Shell({
  children,
  defaultView = "chat",
  activeView: controlledActiveView,
  onViewChange,
  connected = false,
  version,
  uptime,
  onCommandPalette,
}: ShellProps) {
  // Support both controlled and uncontrolled modes
  const [internalActiveView, setInternalActiveView] = useState<ViewId>(defaultView)
  const activeView = controlledActiveView ?? internalActiveView
  const setActiveView = onViewChange ?? setInternalActiveView
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Command/Ctrl + K for command palette
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        onCommandPalette?.()
      }
    },
    [onCommandPalette]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => setActiveView(view as ViewId)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          connected={connected}
          version={version}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header onCommandPalette={onCommandPalette} />

        {/* Content - padding bottom on mobile for bottom nav */}
        <main className="flex-1 overflow-auto pb-20 md:pb-4">{children(activeView)}</main>
      </div>

      {/* Mobile Bottom Navigation - hidden on desktop */}
      <MobileNav
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as ViewId)}
      />
    </div>
  )
}

export type { ViewId }
