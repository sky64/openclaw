"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
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

export function Shell({
  children,
  defaultView = "chat",
  activeView: controlledActiveView,
  onViewChange,
  connected = false,
  version,
  onCommandPalette,
}: ShellProps) {
  const [internalActiveView, setInternalActiveView] = useState<ViewId>(defaultView)
  const activeView = controlledActiveView ?? internalActiveView
  const setActiveView = onViewChange ?? setInternalActiveView
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        onCommandPalette?.()
      }
    },
    [onCommandPalette]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Close mobile menu when view changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [activeView])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
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

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="h-full bg-[var(--surface-1)] shadow-xl">
                {/* Close button */}
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      "hover:bg-[var(--surface-2)] transition-colors"
                    )}
                  >
                    <X size={20} />
                  </button>
                </div>

                <Sidebar
                  activeView={activeView}
                  onViewChange={(view) => setActiveView(view as ViewId)}
                  collapsed={false}
                  connected={connected}
                  version={version}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onCommandPalette={onCommandPalette}
        />

        {/* Content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children(activeView)}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  )
}

export type { ViewId }
