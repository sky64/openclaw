"use client"

import { motion } from "framer-motion"
import {
  ChatCircle,
  Terminal,
  Lightning,
  PuzzlePiece,
  Gear,
  FileText,
  Hexagon,
  CaretLeft,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type ViewId = "chat" | "cli" | "processes" | "skills" | "config" | "documents"

interface NavItem {
  id: ViewId
  label: string
  icon: typeof ChatCircle
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Chat",
    items: [{ id: "chat", label: "Chat", icon: ChatCircle }],
  },
  {
    title: "Control",
    items: [
      { id: "cli", label: "CLI", icon: Terminal },
      { id: "processes", label: "Tasks", icon: Lightning },
    ],
  },
  {
    title: "Agent",
    items: [{ id: "skills", label: "Skills", icon: PuzzlePiece }],
  },
  {
    title: "Settings",
    items: [{ id: "config", label: "Config", icon: Gear }],
  },
  {
    title: "Resources",
    items: [{ id: "documents", label: "Documents", icon: FileText }],
  },
]

interface SidebarProps {
  activeView: ViewId
  onViewChange: (view: ViewId) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  connected?: boolean
  version?: string
}

export function Sidebar({
  activeView,
  onViewChange,
  collapsed = false,
  onCollapsedChange,
  connected = false,
  version,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "h-full flex flex-col",
        "bg-[var(--surface-1)] border-r border-[var(--surface-1-border)]",
        "transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--surface-1-border)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Hexagon size={24} weight="duotone" className="text-amber-500" />
            <span className="font-semibold">SKY64</span>
          </div>
        )}
        {collapsed && (
          <Hexagon size={24} weight="duotone" className="text-amber-500 mx-auto" />
        )}
        <button
          type="button"
          onClick={() => onCollapsedChange?.(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center",
            "hover:bg-[var(--surface-2)] transition-colors",
            collapsed && "mx-auto"
          )}
        >
          <CaretLeft
            size={14}
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {/* Section Header */}
            {!collapsed && (
              <h2 className="px-4 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h2>
            )}

            {/* Section Items */}
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const isActive = activeView === item.id
                const Icon = item.icon

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg",
                      "transition-all duration-150",
                      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                      isActive
                        ? "bg-amber-500/10 text-amber-500 border-l-[3px] border-amber-500 -ml-0.5 pl-[calc(0.75rem-1px)]"
                        : "hover:bg-[var(--surface-2)] hover:scale-[1.02]"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon
                      size={20}
                      weight={isActive ? "fill" : "regular"}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Connection Status */}
      <div className={cn(
        "p-4 border-t border-[var(--surface-1-border)]",
        collapsed && "flex justify-center"
      )}>
        <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
          <motion.div
            className={cn(
              "w-2 h-2 rounded-full",
              connected ? "bg-green-500" : "bg-zinc-500"
            )}
            animate={connected ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          {!collapsed && (
            <div className="text-xs">
              <span className={connected ? "text-green-500" : "text-muted-foreground"}>
                {connected ? "Connected" : "Disconnected"}
              </span>
              {version && (
                <span className="text-muted-foreground ml-2">{version}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
