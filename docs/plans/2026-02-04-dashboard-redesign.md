# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Sky64 dashboard with light/dark theme support, Inter font, hierarchical navigation, and dual-pane CLI layout inspired by browser.cash.

**Architecture:** Add theme provider with localStorage persistence and system preference detection. Restructure sidebar with section headers and Phosphor icons. Refactor CLI view into horizontal split panels that stack vertically on mobile.

**Tech Stack:** Next.js 15, Tailwind CSS 4, next-themes, Phosphor Icons, Framer Motion

---

## Task 1: Add Inter Font and Update CSS Variables

**Files:**
- Modify: `apps/dashboard/src/app/globals.css`

**Step 1: Update globals.css with Inter font and theme variables**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@import "tailwindcss";

:root {
  /* Light mode (default) */
  --background: #ffffff;
  --foreground: #0b0f14;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
  --accent: #f59e0b;
  --accent-foreground: #000000;

  /* Surface levels for depth */
  --surface-1: #ffffff;
  --surface-2: #fafafa;
  --surface-3: #f4f4f5;
  --surface-1-border: #e4e4e7;
  --surface-2-border: #d4d4d8;
  --surface-3-border: #a1a1aa;

  /* Fonts */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

.dark {
  /* Dark mode */
  --background: #000000;
  --foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #71717a;
  --border: #27272a;
  --accent: #f59e0b;
  --accent-foreground: #000000;

  /* Surface levels for depth */
  --surface-1: #09090b;
  --surface-2: #18181b;
  --surface-3: #27272a;
  --surface-1-border: #27272a;
  --surface-2-border: #3f3f46;
  --surface-3-border: #52525b;
}

html {
  color-scheme: light;
}

html.dark {
  color-scheme: dark;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* Noise texture overlay - dark mode only */
.dark body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.02;
  pointer-events: none;
  z-index: 9999;
}

* {
  border-color: var(--border);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground);
}

/* Selection */
::selection {
  background: var(--accent);
  color: var(--accent-foreground);
}
```

**Step 2: Verify the CSS compiles**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/dashboard/src/app/globals.css
git commit -m "feat(dashboard): add Inter font and light/dark theme CSS variables"
```

---

## Task 2: Install next-themes and Create Theme Provider

**Files:**
- Create: `apps/dashboard/src/components/providers/theme-provider.tsx`
- Modify: `apps/dashboard/src/app/layout.tsx`
- Modify: `apps/dashboard/package.json`

**Step 1: Install next-themes**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm add next-themes`

**Step 2: Create theme-provider.tsx**

```tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ReactNode } from "react"

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

**Step 3: Update layout.tsx to wrap with ThemeProvider**

```tsx
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { GatewayProvider } from "@/components/providers/gateway-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sky64 Dashboard",
  description: "Control panel for Sky64 agent orchestration",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <GatewayProvider>
            {children}
          </GatewayProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Step 4: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/dashboard/
git commit -m "feat(dashboard): add next-themes provider for light/dark mode"
```

---

## Task 3: Create Theme Toggle Component

**Files:**
- Create: `apps/dashboard/src/components/ui/theme-toggle.tsx`

**Step 1: Create theme-toggle.tsx**

```tsx
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
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("w-9 h-9", className)} />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative w-9 h-9 rounded-lg flex items-center justify-center",
        "bg-surface-2 border border-surface-2-border",
        "hover:bg-surface-3 hover:scale-105",
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
```

**Step 2: Export from ui/index.ts**

Add to `apps/dashboard/src/components/ui/index.ts`:
```tsx
export { ThemeToggle } from "./theme-toggle"
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/ui/
git commit -m "feat(dashboard): add theme toggle component with sun/moon icons"
```

---

## Task 4: Create New Header Component

**Files:**
- Create: `apps/dashboard/src/components/layout/header.tsx`
- Modify: `apps/dashboard/src/components/layout/index.ts`

**Step 1: Create header.tsx**

```tsx
"use client"

import { motion } from "framer-motion"
import { List, MagnifyingGlass, Hexagon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui"

interface HeaderProps {
  onMenuClick?: () => void
  onCommandPalette?: () => void
  className?: string
}

export function Header({ onMenuClick, onCommandPalette, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between px-4",
        "bg-[var(--surface-1)] border-b border-[var(--surface-1-border)]",
        "sticky top-0 z-30",
        className
      )}
    >
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            "md:hidden w-9 h-9 rounded-lg flex items-center justify-center",
            "hover:bg-[var(--surface-2)] transition-colors"
          )}
          aria-label="Open menu"
        >
          <List size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <Hexagon size={20} weight="duotone" className="text-amber-500" />
          </motion.div>
          <span className="font-semibold text-lg hidden sm:block">SKY64</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        type="button"
        onClick={onCommandPalette}
        className={cn(
          "hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
          "text-sm text-muted-foreground",
          "hover:bg-[var(--surface-3)] hover:text-foreground",
          "transition-colors"
        )}
      >
        <MagnifyingGlass size={16} />
        <span>Search...</span>
        <kbd className="ml-4 px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--surface-3-border)] text-xs font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right: Theme Toggle */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
```

**Step 2: Update layout/index.ts**

Add export:
```tsx
export { Header } from "./header"
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/layout/
git commit -m "feat(dashboard): add header component with logo, search trigger, theme toggle"
```

---

## Task 5: Restructure Sidebar with Hierarchical Navigation

**Files:**
- Modify: `apps/dashboard/src/components/layout/sidebar.tsx`

**Step 1: Rewrite sidebar.tsx with sections**

```tsx
"use client"

import { motion } from "framer-motion"
import {
  ChatCircle,
  Terminal,
  Lightning,
  Puzzle,
  Gear,
  FileText,
  Circle,
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
    items: [{ id: "skills", label: "Skills", icon: Puzzle }],
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
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/layout/sidebar.tsx
git commit -m "feat(dashboard): restructure sidebar with hierarchical sections"
```

---

## Task 6: Update Shell with New Header and Mobile Drawer

**Files:**
- Modify: `apps/dashboard/src/components/layout/shell.tsx`

**Step 1: Rewrite shell.tsx**

```tsx
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)]"
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
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/layout/shell.tsx
git commit -m "feat(dashboard): update shell with new header and mobile drawer"
```

---

## Task 7: Create CLI Input Panel Component

**Files:**
- Create: `apps/dashboard/src/components/cli/input-panel.tsx`

**Step 1: Create input-panel.tsx**

```tsx
"use client"

import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Play, Eraser } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface InputPanelProps {
  onRun: (command: string) => void
  disabled?: boolean
  className?: string
}

export function InputPanel({ onRun, disabled = false, className }: InputPanelProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleRun = useCallback(() => {
    if (!value.trim() || disabled) return
    onRun(value.trim())
  }, [value, disabled, onRun])

  const handleClear = useCallback(() => {
    setValue("")
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl + Enter to run
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleRun()
      }
    },
    [handleRun]
  )

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-[var(--surface-2)] rounded-xl border border-[var(--surface-2-border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-2-border)]">
        <h3 className="text-sm font-medium">Input</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={!value}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              "bg-[var(--surface-3)] border border-[var(--surface-3-border)]",
              "hover:bg-[var(--muted)] transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Eraser size={14} className="inline mr-1" />
            Clear
          </button>
          <motion.button
            type="button"
            onClick={handleRun}
            disabled={!value.trim() || disabled}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium",
              "bg-amber-500 text-black",
              "hover:bg-amber-400 hover:-translate-y-0.5",
              "transition-all shadow-lg shadow-amber-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={14} weight="fill" className="inline mr-1" />
            Run
          </motion.button>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter commands here...&#10;&#10;Use Cmd+Enter to run"
          disabled={disabled}
          className={cn(
            "w-full h-full resize-none",
            "bg-transparent text-sm font-mono",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:opacity-50"
          )}
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-[var(--surface-2-border)]">
        <p className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--surface-3-border)] font-mono">
            ⌘↵
          </kbd>
          {" "}to run
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/cli/input-panel.tsx
git commit -m "feat(dashboard): add CLI input panel with textarea and run button"
```

---

## Task 8: Create CLI Output Panel Component

**Files:**
- Create: `apps/dashboard/src/components/cli/output-panel.tsx`

**Step 1: Create output-panel.tsx**

```tsx
"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Eraser } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { formatTimestamp } from "@/lib/utils"
import type { TerminalLine } from "./terminal"

interface OutputPanelProps {
  lines: TerminalLine[]
  onClear: () => void
  className?: string
}

export function OutputPanel({ lines, onClear, className }: OutputPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-[var(--surface-1)] rounded-xl border border-[var(--surface-1-border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-1-border)]">
        <h3 className="text-sm font-medium">Output</h3>
        <button
          type="button"
          onClick={onClear}
          disabled={lines.length === 0}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium",
            "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
            "hover:bg-[var(--surface-3)] transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Eraser size={14} className="inline mr-1" />
          Clear
        </button>
      </div>

      {/* Output Lines */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {lines.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Output will appear here...
          </p>
        ) : (
          <div className="space-y-1">
            {lines.map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-3",
                  line.type === "error" && "text-red-500",
                  line.type === "input" && "text-amber-500"
                )}
              >
                <span className="text-muted-foreground text-xs shrink-0">
                  {formatTimestamp(line.timestamp)}
                </span>
                <span className="whitespace-pre-wrap break-all">
                  {line.type === "input" && <span className="text-muted-foreground mr-1">$</span>}
                  {line.content}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/cli/output-panel.tsx
git commit -m "feat(dashboard): add CLI output panel with timestamps and auto-scroll"
```

---

## Task 9: Refactor CLI View with Dual-Pane Layout

**Files:**
- Modify: `apps/dashboard/src/components/cli/cli-view.tsx`
- Modify: `apps/dashboard/src/components/cli/index.ts`

**Step 1: Rewrite cli-view.tsx with dual-pane layout**

```tsx
"use client"

import { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Terminal as TerminalIcon, PlugsConnected } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useGateway } from "@/lib/gateway/hooks"
import { InputPanel } from "./input-panel"
import { OutputPanel } from "./output-panel"
import { Terminal, type TerminalLine } from "./terminal"

export interface CLIViewProps {
  className?: string
}

export function CLIView({ className }: CLIViewProps) {
  const { connected, client, health } = useGateway()
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    {
      id: "welcome-1",
      type: "output",
      content: "SKY64 TERMINAL v0.1.0",
      timestamp: Date.now(),
    },
    {
      id: "welcome-2",
      type: "output",
      content: 'Type commands in the input panel or use the quick prompt below.',
      timestamp: Date.now(),
    },
  ])

  const generateId = useCallback(() => {
    return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }, [])

  const addLine = useCallback(
    (type: TerminalLine["type"], content: string) => {
      setLines((prev) => [
        ...prev,
        { id: generateId(), type, content, timestamp: Date.now() },
      ])
    },
    [generateId]
  )

  const addOutput = useCallback(
    (content: string | string[]) => {
      const contentArray = Array.isArray(content) ? content : [content]
      setLines((prev) => [
        ...prev,
        ...contentArray.map((line) => ({
          id: generateId(),
          type: "output" as const,
          content: line,
          timestamp: Date.now(),
        })),
      ])
    },
    [generateId]
  )

  const addError = useCallback(
    (message: string) => {
      addLine("error", `Error: ${message}`)
    },
    [addLine]
  )

  const formatUptime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }, [])

  const commands = useMemo(
    () => ({
      help: () => {
        addOutput([
          "Available commands:",
          "",
          "  help       Show this help message",
          "  status     Show gateway health status",
          "  channels   List channel statuses",
          "  sessions   List recent sessions",
          "  logs [n]   Show last n log entries (default: 20)",
          "  config     Show current configuration",
          "  clear      Clear terminal output",
          "",
        ])
      },
      clear: () => setLines([]),
      status: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }
        try {
          const healthData = await client.health()
          addOutput([
            "Gateway Status:",
            "",
            `  Status:   ${healthData.ok ? "OK" : "DEGRADED"}`,
            `  Version:  ${healthData.version}`,
            `  Uptime:   ${formatUptime(healthData.uptime)}`,
            "",
          ])
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get status")
        }
      },
      channels: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }
        try {
          const result = await client.channelsStatus()
          const outputLines = ["Channel Status:", ""]
          for (const channelId of result.channelOrder) {
            const label = result.channelLabels[channelId] ?? channelId
            const accounts = result.channelAccounts[channelId] ?? []
            if (accounts.length === 0) {
              outputLines.push(`  ${label}: not configured`)
            } else {
              for (const account of accounts) {
                const status = account.connected
                  ? "CONNECTED"
                  : account.enabled
                    ? "DISCONNECTED"
                    : "DISABLED"
                outputLines.push(`  ${label}: ${status}`)
                if (account.lastError) {
                  outputLines.push(`    Error: ${account.lastError}`)
                }
              }
            }
          }
          outputLines.push("")
          addOutput(outputLines)
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get channel status")
        }
      },
      sessions: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }
        try {
          const sessions = await client.sessionsList({
            limit: 10,
            includeDerivedTitles: true,
            includeLastMessage: true,
          })
          const outputLines = ["Recent Sessions:", ""]
          if (sessions.length === 0) {
            outputLines.push("  No sessions found")
          } else {
            for (const session of sessions) {
              const title = session.title ?? session.key
              const date = new Date(session.updatedAt).toLocaleDateString()
              outputLines.push(`  ${title}`)
              outputLines.push(`    Last active: ${date}`)
              outputLines.push(`    Messages: ${session.messageCount}`)
              if (session.lastMessage) {
                const preview =
                  session.lastMessage.length > 50
                    ? session.lastMessage.slice(0, 50) + "..."
                    : session.lastMessage
                outputLines.push(`    Last: "${preview}"`)
              }
              outputLines.push("")
            }
          }
          addOutput(outputLines)
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get sessions")
        }
      },
      logs: async (args: string[]) => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }
        const limit = parseInt(args[0] ?? "20", 10)
        if (isNaN(limit) || limit < 1) {
          addError("Invalid limit. Usage: logs [n]")
          return
        }
        try {
          const result = await client.logsTail({ limit })
          const outputLines = [`Last ${limit} log entries:`, ""]
          if (result.lines.length === 0) {
            outputLines.push("  No logs available")
          } else {
            for (const line of result.lines) {
              outputLines.push(`  ${line}`)
            }
          }
          if (result.truncated) {
            outputLines.push("  ... (truncated)")
          }
          outputLines.push("")
          addOutput(outputLines)
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get logs")
        }
      },
      config: async () => {
        if (!connected || !client) {
          addError("Not connected to gateway")
          return
        }
        try {
          const config = await client.configGet<Record<string, unknown>>()
          const outputLines = ["Current Configuration:", ""]
          const formatValue = (value: unknown, indent = 2): string[] => {
            const lines: string[] = []
            const padding = " ".repeat(indent)
            if (typeof value === "object" && value !== null) {
              for (const [key, val] of Object.entries(value)) {
                if (typeof val === "object" && val !== null) {
                  lines.push(`${padding}${key}:`)
                  lines.push(...formatValue(val, indent + 2))
                } else {
                  lines.push(`${padding}${key}: ${String(val)}`)
                }
              }
            } else {
              lines.push(`${padding}${String(value)}`)
            }
            return lines
          }
          outputLines.push(...formatValue(config))
          outputLines.push("")
          addOutput(outputLines)
        } catch (err) {
          addError(err instanceof Error ? err.message : "Failed to get config")
        }
      },
    }),
    [connected, client, addOutput, addError, formatUptime]
  )

  const handleCommand = useCallback(
    async (commandLine: string) => {
      addLine("input", commandLine)
      const parts = commandLine.trim().split(/\s+/)
      const cmd = parts[0]?.toLowerCase()
      const args = parts.slice(1)

      if (!cmd) return

      if (cmd in commands) {
        const handler = commands[cmd as keyof typeof commands]
        if (cmd === "logs") {
          await (handler as (args: string[]) => Promise<void>)(args)
        } else {
          await (handler as () => void | Promise<void>)()
        }
      } else {
        addError(`Unknown command: ${cmd}. Type "help" for available commands.`)
      }
    },
    [commands, addLine, addError]
  )

  const handleClearOutput = useCallback(() => {
    setLines([])
  }, [])

  // Not connected state
  if (!connected) {
    return (
      <div className={cn("h-full flex flex-col p-4", className)}>
        <CLIHeader />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-4 text-muted-foreground p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
              <PlugsConnected size={40} className="text-muted-foreground" />
            </div>
            <div className="text-center font-mono">
              <p className="text-sm text-foreground">CONNECTION REQUIRED</p>
              <p className="text-xs mt-1 max-w-[280px] text-muted-foreground">
                Connect to the gateway to access the terminal
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col p-4 gap-4", className)}>
      <CLIHeader version={health?.version} uptime={health?.uptime} />

      {/* Dual Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Input Panel - Left on desktop, Top on mobile */}
        <InputPanel
          onRun={handleCommand}
          disabled={!connected}
          className="flex-1 min-h-[200px] md:min-h-0"
        />

        {/* Output Panel - Right on desktop, Bottom on mobile */}
        <OutputPanel
          lines={lines}
          onClear={handleClearOutput}
          className="flex-1 min-h-[200px] md:min-h-0"
        />
      </div>

      {/* Quick Command Input */}
      <div className="flex-shrink-0">
        <Terminal
          lines={[]}
          onCommand={handleCommand}
          prompt="sky64>"
          disabled={!connected}
          className="h-14 rounded-xl"
          minimal
        />
      </div>
    </div>
  )
}

function CLIHeader({ version, uptime }: { version?: string; uptime?: number }) {
  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
          <TerminalIcon size={20} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Terminal</h1>
          <p className="text-sm text-muted-foreground">
            Gateway CLI Interface
          </p>
        </div>
      </div>
      {version && (
        <div className="text-right text-sm text-muted-foreground font-mono">
          <div>{version}</div>
          {uptime !== undefined && <div>Uptime: {formatUptime(uptime)}</div>}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Update terminal.tsx to support minimal mode**

Add `minimal?: boolean` prop to Terminal component that hides the output area and only shows the input line.

**Step 3: Update cli/index.ts**

```tsx
export { CLIView } from "./cli-view"
export { Terminal, type TerminalLine } from "./terminal"
export { InputPanel } from "./input-panel"
export { OutputPanel } from "./output-panel"
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/cli/
git commit -m "feat(dashboard): refactor CLI with dual-pane horizontal layout"
```

---

## Task 10: Add Documents View Placeholder

**Files:**
- Create: `apps/dashboard/src/components/documents/documents-view.tsx`
- Create: `apps/dashboard/src/components/documents/index.ts`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create documents-view.tsx**

```tsx
"use client"

import { motion } from "framer-motion"
import { FileText, FolderOpen } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface DocumentsViewProps {
  className?: string
}

export function DocumentsView({ className }: DocumentsViewProps) {
  return (
    <div className={cn("h-full flex flex-col p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
          <FileText size={20} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Agent documentation and resources
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4 text-muted-foreground p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
            <FolderOpen size={40} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground">Coming Soon</p>
            <p className="text-xs mt-1 max-w-[280px] text-muted-foreground">
              Documentation and resources will be available here
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

**Step 2: Create documents/index.ts**

```tsx
export { DocumentsView } from "./documents-view"
```

**Step 3: Update page.tsx to include DocumentsView**

Add import and case:
```tsx
import { DocumentsView } from "@/components/documents"

// In renderView switch:
case "documents":
  return <DocumentsView />
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/documents/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add documents view placeholder"
```

---

## Task 11: Final Integration and Testing

**Files:**
- Modify: `apps/dashboard/tailwind.config.ts` (add surface color utilities)

**Step 1: Update tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
}

export default config
```

**Step 2: Run build and fix any errors**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 3: Run dev server and test**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm dev`

Test checklist:
- [ ] Light/dark theme toggle works
- [ ] Theme persists on refresh
- [ ] Sidebar sections render correctly
- [ ] Navigation highlights active item
- [ ] CLI dual-pane layout displays
- [ ] CLI input panel runs commands
- [ ] CLI output panel shows results
- [ ] Mobile drawer opens/closes
- [ ] Mobile bottom nav works
- [ ] Documents view shows placeholder

**Step 4: Commit**

```bash
git add apps/dashboard/
git commit -m "feat(dashboard): complete browser.cash-inspired redesign"
```

---

## Summary

This plan implements:

1. **Theme System** - Light/dark mode with next-themes, Inter font
2. **New Header** - Logo, command palette trigger, theme toggle
3. **Hierarchical Sidebar** - Section headers (Chat, Control, Agent, Settings, Resources)
4. **Dual-Pane CLI** - Input left, output right, stacks on mobile
5. **Surface Depth System** - 3 levels of card backgrounds for visual hierarchy
6. **Documents View** - New placeholder view
7. **Mobile Support** - Hamburger menu, slide-out drawer

Total: 11 tasks, ~15 files created/modified
