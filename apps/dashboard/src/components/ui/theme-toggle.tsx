"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sun, Moon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("w-9 h-9", className)} />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative w-9 h-9 rounded-lg flex items-center justify-center",
        "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
        "hover:bg-[var(--surface-3)] hover:scale-105",
        "transition-colors",
        className
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon size={18} weight="fill" className="text-amber-500" />
        ) : (
          <Sun size={18} weight="fill" className="text-amber-500" />
        )}
      </motion.div>
    </motion.button>
  )
}
