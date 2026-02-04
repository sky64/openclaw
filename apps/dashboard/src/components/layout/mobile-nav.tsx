"use client"

import { motion } from "framer-motion"
import {
  ChatCircle,
  Terminal,
  Lightning,
  List,
  Gear,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon: typeof ChatCircle
}

const navItems: NavItem[] = [
  { id: "chat", label: "Chat", icon: ChatCircle },
  { id: "cli", label: "CLI", icon: Terminal },
  { id: "processes", label: "Tasks", icon: Lightning },
  { id: "skills", label: "Skills", icon: List },
  { id: "config", label: "Config", icon: Gear },
]

interface MobileNavProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "relative flex flex-col items-center gap-1 px-3 py-2 transition-colors",
              activeView === item.id
                ? "text-amber-500"
                : "text-muted-foreground"
            )}
          >
            <item.icon
              size={24}
              weight={activeView === item.id ? "fill" : "regular"}
            />
            <span className="text-xs font-medium">{item.label}</span>
            {activeView === item.id && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute bottom-0 h-0.5 w-12 bg-amber-500"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
