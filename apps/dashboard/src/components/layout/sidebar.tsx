"use client"

import { motion } from "framer-motion"
import {
  ChatCircle,
  Terminal,
  Lightning,
  List,
  Gear,
  CaretLeft,
  CaretRight,
  type IconProps,
} from "@phosphor-icons/react"
import clsx from "clsx"
import type { ComponentType } from "react"

// Navigation items configuration
const navItems = [
  { id: "chat", label: "Chat", icon: ChatCircle },
  { id: "cli", label: "CLI", icon: Terminal },
  { id: "processes", label: "Processes", icon: Lightning },
  { id: "skills", label: "Skills", icon: List },
  { id: "config", label: "Config", icon: Gear },
] as const

export type ViewId = (typeof navItems)[number]["id"]

interface StatusOrbProps {
  connected: boolean
  collapsed: boolean
}

/**
 * The signature Status Orb - pulses amber when connected, red when disconnected.
 * Features gradient fill and soft glow effect.
 */
function StatusOrb({ connected, collapsed }: StatusOrbProps) {
  return (
    <div className="relative flex items-center gap-3 px-3 py-2">
      {/* The orb */}
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className={clsx(
            "absolute inset-0 rounded-full blur-sm",
            connected ? "bg-amber-500/50" : "bg-red-500/50"
          )}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main orb with gradient */}
        <motion.div
          className={clsx(
            "relative w-3 h-3 rounded-full",
            connected
              ? "bg-gradient-to-br from-amber-400 to-orange-500"
              : "bg-gradient-to-br from-red-400 to-red-600"
          )}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner highlight */}
        <div
          className={clsx(
            "absolute top-0.5 left-0.5 w-1 h-1 rounded-full opacity-60",
            connected ? "bg-amber-200" : "bg-red-200"
          )}
        />
      </div>

      {/* Status text - only when expanded */}
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-xs font-mono text-muted-foreground uppercase tracking-wider"
        >
          {connected ? "Connected" : "Disconnected"}
        </motion.span>
      )}
    </div>
  )
}

interface NavItemProps {
  id: string
  label: string
  icon: ComponentType<IconProps>
  active: boolean
  collapsed: boolean
  onClick: () => void
}

function NavItem({
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={clsx(
        "relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors",
        "hover:bg-zinc-900/50",
        active && "bg-zinc-900/80"
      )}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator dot */}
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute left-0 w-1 h-4 bg-amber-500 rounded-r"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      <Icon
        size={20}
        weight={active ? "fill" : "regular"}
        className={clsx(
          "transition-colors flex-shrink-0",
          active ? "text-amber-500" : "text-muted-foreground"
        )}
      />

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={clsx(
            "text-sm font-mono tracking-wide",
            active ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  )
}

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  connected?: boolean
  version?: string
  uptime?: string
}

/**
 * Distinctive sidebar with Status Orb, navigation, and collapse functionality.
 * Features smooth animations and the signature amber accent styling.
 */
export function Sidebar({
  activeView,
  onViewChange,
  collapsed,
  onCollapsedChange,
  connected = false,
  version = "v0.1.0",
  uptime,
}: SidebarProps) {
  return (
    <motion.aside
      className={clsx(
        "h-screen flex flex-col border-r border-border bg-black/50",
        "relative"
      )}
      animate={{ width: collapsed ? 64 : 200 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Accent line on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />

      {/* Logo area */}
      <div className="flex items-center justify-center h-16 border-b border-border">
        <motion.span
          className="font-mono font-bold text-foreground tracking-[0.3em]"
          animate={{ fontSize: collapsed ? "0.75rem" : "1rem" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {collapsed ? "S64" : "SKY64"}
        </motion.span>
      </div>

      {/* Status Orb */}
      <div className="pt-4 pb-2 border-b border-border/50">
        <StatusOrb connected={connected} collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            active={activeView === item.id}
            collapsed={collapsed}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </nav>

      {/* Bottom section - version and toggle */}
      <div className="border-t border-border p-2">
        {/* Version/uptime info when expanded */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 py-2 mb-2"
          >
            <div className="text-xs font-mono text-muted-foreground">
              {version}
            </div>
            {uptime && (
              <div className="text-xs font-mono text-muted-foreground/60">
                up {uptime}
              </div>
            )}
          </motion.div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={clsx(
            "flex items-center justify-center w-full py-2 rounded-lg",
            "text-muted-foreground hover:text-foreground hover:bg-zinc-900/50",
            "transition-colors"
          )}
        >
          {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  )
}
