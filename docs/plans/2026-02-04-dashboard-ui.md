# Sky64 Dashboard UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a modern, mobile-first dashboard for sky64_nikki at dashboard.sky64.io with chat, CLI, processes, and config management.

**Architecture:** Next.js 15 App Router with server components for initial data fetch, client components for real-time WebSocket updates. Gateway connection via existing RPC protocol. Cloudflare Pages deployment.

**Tech Stack:** Next.js 15, Tailwind CSS 4, shadcn/ui, Framer Motion, Phosphor Icons, WebSocket (native)

---

## Prerequisites

- Node 22+ installed
- pnpm available
- OpenClaw gateway running on localhost:18789
- Gateway token for authentication

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `apps/dashboard/package.json`
- Create: `apps/dashboard/tsconfig.json`
- Create: `apps/dashboard/next.config.ts`
- Create: `apps/dashboard/tailwind.config.ts`
- Create: `apps/dashboard/postcss.config.js`
- Create: `apps/dashboard/src/app/layout.tsx`
- Create: `apps/dashboard/src/app/page.tsx`
- Create: `apps/dashboard/src/app/globals.css`

**Step 1: Create package.json**

```json
{
  "name": "sky64-dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@phosphor-icons/react": "^2.1.7",
    "framer-motion": "^11.15.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.49"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
```

**Step 4: Create tailwind.config.ts**

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

**Step 5: Create postcss.config.js**

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

**Step 6: Create src/app/globals.css**

```css
@import "tailwindcss";

:root {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --muted: #171717;
  --muted-foreground: #a3a3a3;
  --border: #262626;
  --accent: #3b82f6;
  --accent-foreground: #fafafa;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

html {
  color-scheme: dark;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

* {
  border-color: var(--border);
}
```

**Step 7: Create src/app/layout.tsx**

```tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sky64 Dashboard",
  description: "Control panel for Sky64 agent orchestration",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
```

**Step 8: Create src/app/page.tsx**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Sky64 Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Coming soon...</p>
      </div>
    </main>
  )
}
```

**Step 9: Install dependencies**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm install`
Expected: Dependencies installed successfully

**Step 10: Verify dev server starts**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm dev &`
Run: `sleep 5 && curl -s http://localhost:3000 | head -20`
Expected: HTML response with "Sky64 Dashboard"

**Step 11: Commit**

```bash
git add apps/dashboard/
git commit -m "feat(dashboard): initialize Next.js 15 project with Tailwind 4"
```

---

## Task 2: Gateway Client Library

**Files:**
- Create: `apps/dashboard/src/lib/gateway/types.ts`
- Create: `apps/dashboard/src/lib/gateway/client.ts`
- Create: `apps/dashboard/src/lib/gateway/hooks.ts`

**Step 1: Create types.ts**

```typescript
export interface RequestFrame {
  type: "req"
  id: string
  method: string
  params?: Record<string, unknown>
}

export interface ResponseFrame {
  type: "res"
  id: string
  ok: boolean
  payload?: unknown
  error?: { code: string; message: string }
}

export interface EventFrame {
  type: "event"
  event: string
  payload?: unknown
  seq: number
  stateVersion: number
}

export type Frame = RequestFrame | ResponseFrame | EventFrame

export interface HealthSnapshot {
  ok: boolean
  uptime: number
  version: string
  channels: Record<string, { connected: boolean; error?: string }>
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  attachments?: ChatAttachment[]
}

export interface ChatAttachment {
  type: "image" | "file" | "tool_output"
  name?: string
  url?: string
  content?: string
}

export interface SessionInfo {
  id: string
  title?: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

export interface ChannelStatus {
  name: string
  connected: boolean
  username?: string
  error?: string
}

export interface AgentInfo {
  id: string
  name: string
  status: "idle" | "busy" | "error"
  model?: string
}

export interface LogEntry {
  timestamp: number
  level: "debug" | "info" | "warn" | "error"
  message: string
  source?: string
}
```

**Step 2: Create client.ts**

```typescript
import type {
  Frame,
  RequestFrame,
  ResponseFrame,
  EventFrame,
  HealthSnapshot,
  ChatMessage,
  SessionInfo,
  ChannelStatus,
  LogEntry,
} from "./types"

type EventCallback = (event: EventFrame) => void

export class GatewayClient {
  private ws: WebSocket | null = null
  private url: string
  private token: string
  private requestId = 0
  private pending = new Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()
  private eventListeners = new Map<string, Set<EventCallback>>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(url: string, token: string) {
    this.url = url
    this.token = token
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = new URL(this.url)
      wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:"

      this.ws = new WebSocket(wsUrl.toString())

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.authenticate().then(resolve).catch(reject)
      }

      this.ws.onmessage = (event) => {
        try {
          const frame: Frame = JSON.parse(event.data)
          this.handleFrame(frame)
        } catch {
          console.error("Failed to parse frame:", event.data)
        }
      }

      this.ws.onclose = () => {
        this.handleDisconnect()
      }

      this.ws.onerror = (error) => {
        reject(new Error("WebSocket error"))
      }
    })
  }

  private async authenticate(): Promise<void> {
    await this.request("auth", { token: this.token })
  }

  private handleFrame(frame: Frame): void {
    if (frame.type === "res") {
      const pending = this.pending.get(frame.id)
      if (pending) {
        this.pending.delete(frame.id)
        if (frame.ok) {
          pending.resolve(frame.payload)
        } else {
          pending.reject(new Error(frame.error?.message || "Request failed"))
        }
      }
    } else if (frame.type === "event") {
      const listeners = this.eventListeners.get(frame.event)
      if (listeners) {
        for (const callback of listeners) {
          callback(frame)
        }
      }
      const allListeners = this.eventListeners.get("*")
      if (allListeners) {
        for (const callback of allListeners) {
          callback(frame)
        }
      }
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        this.connect().catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("Not connected"))
        return
      }

      const id = String(++this.requestId)
      const frame: RequestFrame = { type: "req", id, method, params }

      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
      this.ws.send(JSON.stringify(frame))

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error("Request timeout"))
        }
      }, 30000)
    })
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
    return () => this.eventListeners.get(event)?.delete(callback)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // Convenience methods
  async health(): Promise<HealthSnapshot> {
    return this.request("health")
  }

  async channelsStatus(): Promise<ChannelStatus[]> {
    return this.request("channels.status")
  }

  async sessionsList(): Promise<SessionInfo[]> {
    return this.request("sessions.list")
  }

  async chatHistory(sessionId?: string): Promise<ChatMessage[]> {
    return this.request("chat.history", { sessionId })
  }

  async chatSend(message: string, sessionId?: string): Promise<void> {
    return this.request("chat.send", { message, sessionId })
  }

  async chatAbort(): Promise<void> {
    return this.request("chat.abort")
  }

  async logsTail(limit?: number): Promise<LogEntry[]> {
    return this.request("logs.tail", { limit })
  }

  async configGet(): Promise<Record<string, unknown>> {
    return this.request("config.get")
  }

  async configSet(key: string, value: unknown): Promise<void> {
    return this.request("config.set", { key, value })
  }
}
```

**Step 3: Create hooks.ts**

```typescript
"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { GatewayClient } from "./client"
import type { HealthSnapshot, ChatMessage, EventFrame } from "./types"

interface GatewayContextValue {
  client: GatewayClient | null
  connected: boolean
  health: HealthSnapshot | null
  connect: (url: string, token: string) => Promise<void>
  disconnect: () => void
}

const GatewayContext = createContext<GatewayContextValue | null>(null)

export function useGateway() {
  const context = useContext(GatewayContext)
  if (!context) {
    throw new Error("useGateway must be used within GatewayProvider")
  }
  return context
}

export function useGatewayEvent(event: string, callback: (e: EventFrame) => void) {
  const { client } = useGateway()

  useEffect(() => {
    if (!client) return
    return client.on(event, callback)
  }, [client, event, callback])
}

export function useChat(sessionId?: string) {
  const { client, connected } = useGateway()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    if (!client || !connected) return

    setLoading(true)
    client.chatHistory(sessionId)
      .then(setMessages)
      .finally(() => setLoading(false))
  }, [client, connected, sessionId])

  useEffect(() => {
    if (!client) return

    return client.on("chat", (event) => {
      const payload = event.payload as { message?: ChatMessage; streaming?: boolean; done?: boolean }

      if (payload.streaming) {
        setStreaming(true)
      }

      if (payload.message) {
        setMessages(prev => {
          const existing = prev.find(m => m.id === payload.message!.id)
          if (existing) {
            return prev.map(m => m.id === payload.message!.id ? payload.message! : m)
          }
          return [...prev, payload.message!]
        })
      }

      if (payload.done) {
        setStreaming(false)
      }
    })
  }, [client])

  const send = useCallback(async (message: string) => {
    if (!client) return
    await client.chatSend(message, sessionId)
  }, [client, sessionId])

  const abort = useCallback(async () => {
    if (!client) return
    await client.chatAbort()
  }, [client])

  return { messages, loading, streaming, send, abort }
}

export { GatewayContext }
export type { GatewayContextValue }
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/lib/gateway/
git commit -m "feat(dashboard): add gateway client library with WebSocket RPC"
```

---

## Task 3: Gateway Provider Component

**Files:**
- Create: `apps/dashboard/src/components/providers/gateway-provider.tsx`
- Modify: `apps/dashboard/src/app/layout.tsx`

**Step 1: Create gateway-provider.tsx**

```tsx
"use client"

import { useState, useCallback, useEffect, type ReactNode } from "react"
import { GatewayClient } from "@/lib/gateway/client"
import { GatewayContext, type GatewayContextValue } from "@/lib/gateway/hooks"
import type { HealthSnapshot } from "@/lib/gateway/types"

interface GatewayProviderProps {
  children: ReactNode
  initialUrl?: string
  initialToken?: string
}

export function GatewayProvider({
  children,
  initialUrl,
  initialToken
}: GatewayProviderProps) {
  const [client, setClient] = useState<GatewayClient | null>(null)
  const [connected, setConnected] = useState(false)
  const [health, setHealth] = useState<HealthSnapshot | null>(null)

  const connect = useCallback(async (url: string, token: string) => {
    const newClient = new GatewayClient(url, token)

    try {
      await newClient.connect()
      setClient(newClient)
      setConnected(true)

      const healthData = await newClient.health()
      setHealth(healthData)

      newClient.on("health", (event) => {
        setHealth(event.payload as HealthSnapshot)
      })

      localStorage.setItem("gateway_url", url)
      localStorage.setItem("gateway_token", token)
    } catch (error) {
      console.error("Failed to connect:", error)
      throw error
    }
  }, [])

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect()
      setClient(null)
      setConnected(false)
      setHealth(null)
    }
  }, [client])

  useEffect(() => {
    const savedUrl = initialUrl || localStorage.getItem("gateway_url")
    const savedToken = initialToken || localStorage.getItem("gateway_token")

    if (savedUrl && savedToken) {
      connect(savedUrl, savedToken).catch(console.error)
    }

    return () => {
      client?.disconnect()
    }
  }, [])

  const value: GatewayContextValue = {
    client,
    connected,
    health,
    connect,
    disconnect,
  }

  return (
    <GatewayContext.Provider value={value}>
      {children}
    </GatewayContext.Provider>
  )
}
```

**Step 2: Update layout.tsx**

```tsx
import type { Metadata } from "next"
import { GatewayProvider } from "@/components/providers/gateway-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sky64 Dashboard",
  description: "Control panel for Sky64 agent orchestration",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <GatewayProvider>
          {children}
        </GatewayProvider>
      </body>
    </html>
  )
}
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/providers/
git add apps/dashboard/src/app/layout.tsx
git commit -m "feat(dashboard): add GatewayProvider for WebSocket state management"
```

---

## Task 4: UI Utilities and Base Components

**Files:**
- Create: `apps/dashboard/src/lib/utils.ts`
- Create: `apps/dashboard/src/components/ui/button.tsx`
- Create: `apps/dashboard/src/components/ui/input.tsx`
- Create: `apps/dashboard/src/components/ui/card.tsx`
- Create: `apps/dashboard/src/components/ui/badge.tsx`

**Step 1: Create utils.ts**

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}
```

**Step 2: Create button.tsx**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive"
  size?: "sm" | "md" | "lg" | "icon"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-accent text-accent-foreground hover:bg-accent/90": variant === "default",
            "hover:bg-muted": variant === "ghost",
            "border border-border bg-transparent hover:bg-muted": variant === "outline",
            "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
```

**Step 3: Create input.tsx**

```tsx
import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
```

**Step 4: Create card.tsx**

```tsx
import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border bg-muted/50 p-4",
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = "Card"

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 pb-4", className)}
        {...props}
      />
    )
  }
)

CardHeader.displayName = "CardHeader"

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold", className)}
        {...props}
      />
    )
  }
)

CardTitle.displayName = "CardTitle"

export const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("", className)} {...props} />
  }
)

CardContent.displayName = "CardContent"
```

**Step 5: Create badge.tsx**

```tsx
import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-muted text-muted-foreground": variant === "default",
          "bg-green-500/20 text-green-400": variant === "success",
          "bg-yellow-500/20 text-yellow-400": variant === "warning",
          "bg-red-500/20 text-red-400": variant === "error",
        },
        className
      )}
      {...props}
    />
  )
}
```

**Step 6: Commit**

```bash
git add apps/dashboard/src/lib/utils.ts apps/dashboard/src/components/ui/
git commit -m "feat(dashboard): add UI utilities and base components"
```

---

## Task 5: Shell Layout with Sidebar

**Files:**
- Create: `apps/dashboard/src/components/layout/sidebar.tsx`
- Create: `apps/dashboard/src/components/layout/header.tsx`
- Create: `apps/dashboard/src/components/layout/shell.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create sidebar.tsx**

```tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChatCircle,
  Terminal,
  Gear,
  List,
  Lightning,
  X,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useGateway } from "@/lib/gateway/hooks"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  id: string
  label: string
  icon: typeof ChatCircle
}

const navItems: NavItem[] = [
  { id: "chat", label: "Chat", icon: ChatCircle },
  { id: "cli", label: "CLI", icon: Terminal },
  { id: "processes", label: "Processes", icon: Lightning },
  { id: "skills", label: "Skills", icon: List },
  { id: "config", label: "Config", icon: Gear },
]

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({
  activeView,
  onViewChange,
  collapsed = false,
  onCollapsedChange
}: SidebarProps) {
  const { connected, health } = useGateway()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      className="flex h-full flex-col border-r border-border bg-background"
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-lg font-bold">Sky64</span>
              <Badge variant={connected ? "success" : "error"}>
                {connected ? "Online" : "Offline"}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="rounded-lg p-1.5 hover:bg-muted"
        >
          {collapsed ? <CaretRight size={18} /> : <CaretLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              activeView === item.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon size={20} weight={activeView === item.id ? "fill" : "regular"} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <AnimatePresence mode="wait">
          {!collapsed && health && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground"
            >
              <p>v{health.version}</p>
              <p>Uptime: {Math.floor(health.uptime / 60)}m</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
```

**Step 2: Create header.tsx**

```tsx
"use client"

import { Command, Bell, User } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onCommandPalette?: () => void
}

export function Header({ onCommandPalette }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCommandPalette}
          className="gap-2 text-muted-foreground"
        >
          <Command size={14} />
          <span>Command</span>
          <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell size={18} />
        </Button>
        <Button variant="ghost" size="icon">
          <User size={18} />
        </Button>
      </div>
    </header>
  )
}
```

**Step 3: Create shell.tsx**

```tsx
"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface ShellProps {
  children: (activeView: string) => ReactNode
}

export function Shell({ children }: ShellProps) {
  const [activeView, setActiveView] = useState("chat")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 overflow-auto p-4">
          {children(activeView)}
        </main>
      </div>
    </div>
  )
}
```

**Step 4: Update page.tsx**

```tsx
"use client"

import { Shell } from "@/components/layout/shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

function ChatView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Chat interface coming soon...</p>
      </CardContent>
    </Card>
  )
}

function CLIView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>CLI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">CLI interface coming soon...</p>
      </CardContent>
    </Card>
  )
}

function ProcessesView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Processes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Processes view coming soon...</p>
      </CardContent>
    </Card>
  )
}

function SkillsView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Skills list coming soon...</p>
      </CardContent>
    </Card>
  )
}

function ConfigView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Config editor coming soon...</p>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  return (
    <Shell>
      {(activeView) => {
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
            return <ConfigView />
          default:
            return <ChatView />
        }
      }}
    </Shell>
  )
}
```

**Step 5: Commit**

```bash
git add apps/dashboard/src/components/layout/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add shell layout with sidebar navigation"
```

---

## Task 6: Connection Dialog

**Files:**
- Create: `apps/dashboard/src/components/dialogs/connection-dialog.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create connection-dialog.tsx**

```tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plugs, CircleNotch } from "@phosphor-icons/react"
import { useGateway } from "@/lib/gateway/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface ConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectionDialog({ open, onOpenChange }: ConnectionDialogProps) {
  const { connect, connected } = useGateway()
  const [url, setUrl] = useState("http://localhost:18789")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      await connect(url, token)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return null
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Plugs size={20} />
                  Connect to Gateway
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                >
                  <X size={18} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gateway URL</label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://localhost:18789"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auth Token</label>
                  <Input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter gateway token"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <Button
                  className="w-full"
                  onClick={handleConnect}
                  disabled={loading || !url || !token}
                >
                  {loading ? (
                    <>
                      <CircleNotch size={18} className="mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Update page.tsx to show connection dialog when not connected**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Shell } from "@/components/layout/shell"
import { ConnectionDialog } from "@/components/dialogs/connection-dialog"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useGateway } from "@/lib/gateway/hooks"

function ChatView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Chat interface coming soon...</p>
      </CardContent>
    </Card>
  )
}

function CLIView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>CLI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">CLI interface coming soon...</p>
      </CardContent>
    </Card>
  )
}

function ProcessesView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Processes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Processes view coming soon...</p>
      </CardContent>
    </Card>
  )
}

function SkillsView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Skills list coming soon...</p>
      </CardContent>
    </Card>
  )
}

function ConfigView() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Config editor coming soon...</p>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const { connected } = useGateway()
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)

  useEffect(() => {
    if (!connected) {
      const timer = setTimeout(() => {
        setConnectionDialogOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [connected])

  return (
    <>
      <Shell>
        {(activeView) => {
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
              return <ConfigView />
            default:
              return <ChatView />
          }
        }}
      </Shell>
      <ConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
      />
    </>
  )
}
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/dialogs/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add connection dialog for gateway auth"
```

---

## Task 7: Chat Interface

**Files:**
- Create: `apps/dashboard/src/components/chat/chat-view.tsx`
- Create: `apps/dashboard/src/components/chat/message-list.tsx`
- Create: `apps/dashboard/src/components/chat/message-input.tsx`
- Create: `apps/dashboard/src/components/chat/message-bubble.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create message-bubble.tsx**

```tsx
"use client"

import { motion } from "framer-motion"
import { User, Robot } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { formatTimestamp } from "@/lib/utils"
import type { ChatMessage } from "@/lib/gateway/types"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-accent" : "bg-muted"
        )}
      >
        {isUser ? <User size={16} /> : <Robot size={16} />}
      </div>

      <div
        className={cn(
          "max-w-[70%] space-y-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-accent text-accent-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          )}
        >
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </motion.div>
  )
}
```

**Step 2: Create message-list.tsx**

```tsx
"use client"

import { useRef, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { MessageBubble } from "./message-bubble"
import type { ChatMessage } from "@/lib/gateway/types"

interface MessageListProps {
  messages: ChatMessage[]
  loading?: boolean
}

export function MessageList({ messages, loading }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm text-muted-foreground">
          Start a conversation with Sky64
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>
    </div>
  )
}
```

**Step 3: Create message-input.tsx**

```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { PaperPlaneRight, Stop, CircleNotch } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSend: (message: string) => void
  onAbort?: () => void
  streaming?: boolean
  disabled?: boolean
}

export function MessageInput({
  onSend,
  onAbort,
  streaming = false,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (message.trim() && !disabled && !streaming) {
      onSend(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || streaming}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 pr-12 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-accent",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>

        {streaming ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={onAbort}
            className="shrink-0"
          >
            <Stop size={18} weight="fill" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className="shrink-0"
          >
            {disabled ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <PaperPlaneRight size={18} weight="fill" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
```

**Step 4: Create chat-view.tsx**

```tsx
"use client"

import { useChat, useGateway } from "@/lib/gateway/hooks"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { Card } from "@/components/ui/card"

export function ChatView() {
  const { connected } = useGateway()
  const { messages, loading, streaming, send, abort } = useChat()

  if (!connected) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Connect to gateway to start chatting</p>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-semibold">Chat with Sky64</h2>
      </div>
      <MessageList messages={messages} loading={loading} />
      <MessageInput
        onSend={send}
        onAbort={abort}
        streaming={streaming}
        disabled={!connected}
      />
    </Card>
  )
}
```

**Step 5: Update page.tsx to use ChatView**

Replace the `ChatView` function in page.tsx with an import:

```tsx
// At the top of page.tsx, add:
import { ChatView } from "@/components/chat/chat-view"

// Remove the old ChatView function definition
```

**Step 6: Commit**

```bash
git add apps/dashboard/src/components/chat/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add chat interface with real-time messaging"
```

---

## Task 8: CLI Terminal View

**Files:**
- Create: `apps/dashboard/src/components/cli/cli-view.tsx`
- Create: `apps/dashboard/src/components/cli/terminal.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create terminal.tsx**

```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TerminalLine {
  id: string
  type: "input" | "output" | "error"
  content: string
  timestamp: number
}

interface TerminalProps {
  lines: TerminalLine[]
  onCommand: (command: string) => void
  prompt?: string
  disabled?: boolean
}

export function Terminal({
  lines,
  onCommand,
  prompt = "sky64>",
  disabled = false,
}: TerminalProps) {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onCommand(input.trim())
      setHistory((prev) => [...prev, input.trim()])
      setHistoryIndex(-1)
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  const focusInput = () => {
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className="h-full cursor-text overflow-y-auto bg-black p-4 font-mono text-sm"
    >
      {lines.map((line) => (
        <div key={line.id} className="whitespace-pre-wrap">
          {line.type === "input" && (
            <span className="text-green-400">{prompt} </span>
          )}
          <span
            className={cn({
              "text-white": line.type === "input",
              "text-gray-300": line.type === "output",
              "text-red-400": line.type === "error",
            })}
          >
            {line.content}
          </span>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-green-400">{prompt} </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
          className="flex-1 bg-transparent text-white outline-none"
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  )
}
```

**Step 2: Create cli-view.tsx**

```tsx
"use client"

import { useState, useCallback } from "react"
import { useGateway } from "@/lib/gateway/hooks"
import { Terminal } from "./terminal"
import { Card } from "@/components/ui/card"

interface TerminalLine {
  id: string
  type: "input" | "output" | "error"
  content: string
  timestamp: number
}

export function CLIView() {
  const { client, connected } = useGateway()
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "welcome",
      type: "output",
      content: "Sky64 CLI v0.1.0\nType 'help' for available commands.\n",
      timestamp: Date.now(),
    },
  ])

  const addLine = useCallback((type: "input" | "output" | "error", content: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        content,
        timestamp: Date.now(),
      },
    ])
  }, [])

  const handleCommand = useCallback(
    async (command: string) => {
      addLine("input", command)

      if (!client || !connected) {
        addLine("error", "Not connected to gateway")
        return
      }

      const [cmd, ...args] = command.split(" ")

      try {
        switch (cmd.toLowerCase()) {
          case "help":
            addLine(
              "output",
              `Available commands:
  help          - Show this help message
  status        - Show gateway status
  channels      - List channel statuses
  sessions      - List chat sessions
  logs [n]      - Show last n log entries (default: 20)
  config        - Show current configuration
  clear         - Clear terminal
`
            )
            break

          case "status": {
            const health = await client.health()
            addLine(
              "output",
              `Gateway Status:
  OK: ${health.ok}
  Version: ${health.version}
  Uptime: ${Math.floor(health.uptime / 60)} minutes
`
            )
            break
          }

          case "channels": {
            const channels = await client.channelsStatus()
            const output = channels
              .map((ch) => `  ${ch.name}: ${ch.connected ? "connected" : "disconnected"}`)
              .join("\n")
            addLine("output", `Channels:\n${output}\n`)
            break
          }

          case "sessions": {
            const sessions = await client.sessionsList()
            if (sessions.length === 0) {
              addLine("output", "No sessions found\n")
            } else {
              const output = sessions
                .slice(0, 10)
                .map((s) => `  ${s.id.slice(0, 8)} - ${s.title || "Untitled"} (${s.messageCount} msgs)`)
                .join("\n")
              addLine("output", `Recent sessions:\n${output}\n`)
            }
            break
          }

          case "logs": {
            const limit = parseInt(args[0]) || 20
            const logs = await client.logsTail(limit)
            if (logs.length === 0) {
              addLine("output", "No logs found\n")
            } else {
              const output = logs
                .map((l) => `[${l.level.toUpperCase()}] ${l.message}`)
                .join("\n")
              addLine("output", `${output}\n`)
            }
            break
          }

          case "config": {
            const config = await client.configGet()
            addLine("output", JSON.stringify(config, null, 2) + "\n")
            break
          }

          case "clear":
            setLines([])
            break

          default:
            addLine("error", `Unknown command: ${cmd}\nType 'help' for available commands.\n`)
        }
      } catch (error) {
        addLine("error", `Error: ${error instanceof Error ? error.message : "Unknown error"}\n`)
      }
    },
    [client, connected, addLine]
  )

  if (!connected) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Connect to gateway to use CLI</p>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-hidden p-0">
      <Terminal lines={lines} onCommand={handleCommand} disabled={!connected} />
    </Card>
  )
}
```

**Step 3: Update page.tsx to use CLIView**

```tsx
// Add import at top:
import { CLIView } from "@/components/cli/cli-view"

// Remove the old CLIView function definition
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/cli/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add CLI terminal interface"
```

---

## Task 9: Processes View

**Files:**
- Create: `apps/dashboard/src/components/processes/processes-view.tsx`
- Create: `apps/dashboard/src/components/processes/process-card.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create process-card.tsx**

```tsx
"use client"

import { motion } from "framer-motion"
import { Lightning, CircleNotch, CheckCircle, XCircle, Clock } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatTimestamp } from "@/lib/utils"

interface Process {
  id: string
  name: string
  status: "running" | "completed" | "failed" | "pending"
  startedAt: number
  completedAt?: number
  progress?: number
  error?: string
}

interface ProcessCardProps {
  process: Process
}

export function ProcessCard({ process }: ProcessCardProps) {
  const statusConfig = {
    running: {
      icon: CircleNotch,
      variant: "warning" as const,
      label: "Running",
      iconClass: "animate-spin",
    },
    completed: {
      icon: CheckCircle,
      variant: "success" as const,
      label: "Completed",
      iconClass: "",
    },
    failed: {
      icon: XCircle,
      variant: "error" as const,
      label: "Failed",
      iconClass: "",
    },
    pending: {
      icon: Clock,
      variant: "default" as const,
      label: "Pending",
      iconClass: "",
    },
  }

  const config = statusConfig[process.status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                process.status === "running" && "bg-yellow-500/20",
                process.status === "completed" && "bg-green-500/20",
                process.status === "failed" && "bg-red-500/20",
                process.status === "pending" && "bg-muted"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  config.iconClass,
                  process.status === "running" && "text-yellow-400",
                  process.status === "completed" && "text-green-400",
                  process.status === "failed" && "text-red-400",
                  process.status === "pending" && "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <h3 className="font-medium">{process.name}</h3>
              <p className="text-sm text-muted-foreground">
                Started {formatTimestamp(process.startedAt)}
              </p>
            </div>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        {process.status === "running" && process.progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span>{process.progress}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${process.progress}%` }}
              />
            </div>
          </div>
        )}

        {process.status === "failed" && process.error && (
          <p className="mt-3 text-sm text-red-400">{process.error}</p>
        )}
      </Card>
    </motion.div>
  )
}

export type { Process }
```

**Step 2: Create processes-view.tsx**

```tsx
"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { Lightning, Plus } from "@phosphor-icons/react"
import { useGateway, useGatewayEvent } from "@/lib/gateway/hooks"
import { ProcessCard, type Process } from "./process-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ProcessesView() {
  const { client, connected } = useGateway()
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client || !connected) {
      setLoading(false)
      return
    }

    // Fetch initial processes (agents, cron jobs, etc.)
    const fetchProcesses = async () => {
      try {
        // For now, simulate with some mock data
        // In real implementation, call client.request("agents.list") etc.
        setProcesses([
          {
            id: "1",
            name: "Main Agent Session",
            status: "running",
            startedAt: Date.now() - 300000,
            progress: 45,
          },
          {
            id: "2",
            name: "Telegram Bot",
            status: "completed",
            startedAt: Date.now() - 600000,
            completedAt: Date.now() - 500000,
          },
          {
            id: "3",
            name: "Cron: Daily Backup",
            status: "pending",
            startedAt: Date.now(),
          },
        ])
      } catch (error) {
        console.error("Failed to fetch processes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProcesses()
  }, [client, connected])

  useGatewayEvent("agent", (event) => {
    // Update process list when agent events come in
    console.log("Agent event:", event)
  })

  if (!connected) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Connect to gateway to view processes</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightning size={24} weight="fill" className="text-accent" />
          <h1 className="text-2xl font-bold">Processes</h1>
        </div>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          New Agent
        </Button>
      </div>

      {loading ? (
        <Card className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading processes...</p>
        </Card>
      ) : processes.length === 0 ? (
        <Card className="flex h-64 flex-col items-center justify-center gap-2">
          <Lightning size={48} className="text-muted-foreground" />
          <p className="text-lg font-medium">No active processes</p>
          <p className="text-sm text-muted-foreground">
            Start a new agent or schedule a task
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {processes.map((process) => (
              <ProcessCard key={process.id} process={process} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Update page.tsx to use ProcessesView**

```tsx
// Add import at top:
import { ProcessesView } from "@/components/processes/processes-view"

// Remove the old ProcessesView function definition
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/processes/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add processes view with status cards"
```

---

## Task 10: Skills List View

**Files:**
- Create: `apps/dashboard/src/components/skills/skills-view.tsx`
- Create: `apps/dashboard/src/components/skills/skill-card.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create skill-card.tsx**

```tsx
"use client"

import { motion } from "framer-motion"
import { Lightning, Copy, Play } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Skill {
  name: string
  description: string
  category?: string
  invocable?: boolean
}

interface SkillCardProps {
  skill: Skill
  onInvoke?: (name: string) => void
}

export function SkillCard({ skill, onInvoke }: SkillCardProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`/${skill.name}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
    >
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-semibold text-accent">/{skill.name}</code>
              {skill.category && (
                <Badge variant="default">{skill.category}</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {skill.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="gap-1"
          >
            <Copy size={14} />
            Copy
          </Button>
          {skill.invocable && onInvoke && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInvoke(skill.name)}
              className="gap-1"
            >
              <Play size={14} weight="fill" />
              Run
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export type { Skill }
```

**Step 2: Create skills-view.tsx**

```tsx
"use client"

import { useState } from "react"
import { List, MagnifyingGlass } from "@phosphor-icons/react"
import { SkillCard, type Skill } from "./skill-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGateway } from "@/lib/gateway/hooks"

// Mock skills data - in real implementation, fetch from gateway
const MOCK_SKILLS: Skill[] = [
  {
    name: "commit",
    description: "Create a git commit with a well-formatted message",
    category: "git",
    invocable: true,
  },
  {
    name: "review-pr",
    description: "Review a GitHub pull request and provide feedback",
    category: "git",
    invocable: true,
  },
  {
    name: "brainstorming",
    description: "Explore user intent, requirements and design before implementation",
    category: "planning",
    invocable: true,
  },
  {
    name: "writing-plans",
    description: "Write comprehensive implementation plans for multi-step tasks",
    category: "planning",
    invocable: true,
  },
  {
    name: "test-driven-development",
    description: "Implement features using TDD methodology - write tests first",
    category: "development",
    invocable: true,
  },
  {
    name: "systematic-debugging",
    description: "Debug issues methodically with hypothesis testing",
    category: "development",
    invocable: true,
  },
  {
    name: "verification-before-completion",
    description: "Run verification commands before claiming work is complete",
    category: "quality",
    invocable: true,
  },
  {
    name: "requesting-code-review",
    description: "Request code review when completing major features",
    category: "quality",
    invocable: true,
  },
]

export function SkillsView() {
  const { connected } = useGateway()
  const [search, setSearch] = useState("")
  const [skills] = useState<Skill[]>(MOCK_SKILLS)

  const filteredSkills = skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.description.toLowerCase().includes(search.toLowerCase()) ||
      skill.category?.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(skills.map((s) => s.category).filter(Boolean))]

  const handleInvoke = (name: string) => {
    // In real implementation, invoke skill via gateway
    console.log("Invoke skill:", name)
  }

  if (!connected) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Connect to gateway to view skills</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List size={24} weight="fill" className="text-accent" />
          <h1 className="text-2xl font-bold">Skills</h1>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlass
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredSkills.length === 0 ? (
        <Card className="flex h-64 flex-col items-center justify-center gap-2">
          <List size={48} className="text-muted-foreground" />
          <p className="text-lg font-medium">No skills found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search term
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.name} skill={skill} onInvoke={handleInvoke} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Update page.tsx to use SkillsView**

```tsx
// Add import at top:
import { SkillsView } from "@/components/skills/skills-view"

// Remove the old SkillsView function definition
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/skills/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add skills list view with search"
```

---

## Task 11: Config View

**Files:**
- Create: `apps/dashboard/src/components/config/config-view.tsx`
- Create: `apps/dashboard/src/components/config/config-section.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Step 1: Create config-section.tsx**

```tsx
"use client"

import { useState } from "react"
import { CaretDown, CaretRight } from "@phosphor-icons/react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ConfigSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function ConfigSection({ title, children, defaultOpen = true }: ConfigSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
      >
        <h3 className="font-semibold">{title}</h3>
        {open ? <CaretDown size={18} /> : <CaretRight size={18} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

interface ConfigFieldProps {
  label: string
  description?: string
  children: React.ReactNode
}

export function ConfigField({ label, description, children }: ConfigFieldProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}
```

**Step 2: Create config-view.tsx**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Gear, FloppyDisk } from "@phosphor-icons/react"
import { useGateway } from "@/lib/gateway/hooks"
import { ConfigSection, ConfigField } from "./config-section"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function ConfigView() {
  const { client, connected, health } = useGateway()
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!client || !connected) {
      setLoading(false)
      return
    }

    client
      .configGet()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [client, connected])

  const handleSave = async (key: string, value: unknown) => {
    if (!client) return
    setSaving(true)
    try {
      await client.configSet(key, value)
      const newConfig = await client.configGet()
      setConfig(newConfig)
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setSaving(false)
    }
  }

  if (!connected) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Connect to gateway to view configuration</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading configuration...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gear size={24} weight="fill" className="text-accent" />
          <h1 className="text-2xl font-bold">Configuration</h1>
        </div>
        {saving && <Badge>Saving...</Badge>}
      </div>

      <ConfigSection title="Gateway">
        <ConfigField label="Version" description="Current gateway version">
          <Badge variant="default">{health?.version || "Unknown"}</Badge>
        </ConfigField>
        <ConfigField label="Uptime" description="Time since last restart">
          <span className="text-sm">
            {health ? `${Math.floor(health.uptime / 60)} minutes` : "Unknown"}
          </span>
        </ConfigField>
        <ConfigField label="Status" description="Gateway health status">
          <Badge variant={health?.ok ? "success" : "error"}>
            {health?.ok ? "Healthy" : "Unhealthy"}
          </Badge>
        </ConfigField>
      </ConfigSection>

      <ConfigSection title="Channels">
        {health?.channels &&
          Object.entries(health.channels).map(([name, status]) => (
            <ConfigField key={name} label={name} description={status.error}>
              <Badge variant={status.connected ? "success" : "error"}>
                {status.connected ? "Connected" : "Disconnected"}
              </Badge>
            </ConfigField>
          ))}
      </ConfigSection>

      <ConfigSection title="Security" defaultOpen={false}>
        <ConfigField
          label="Rate Limiting"
          description="Limit requests per minute"
        >
          <Badge variant="success">Enabled</Badge>
        </ConfigField>
        <ConfigField
          label="Audit Logging"
          description="Log all operations"
        >
          <Badge variant="success">Enabled</Badge>
        </ConfigField>
      </ConfigSection>

      <ConfigSection title="Advanced" defaultOpen={false}>
        <div className="rounded-lg bg-black p-4 font-mono text-sm">
          <pre className="overflow-x-auto text-gray-300">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </ConfigSection>
    </div>
  )
}
```

**Step 3: Update page.tsx to use ConfigView**

```tsx
// Add import at top:
import { ConfigView } from "@/components/config/config-view"

// Remove the old ConfigView function definition
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/config/ apps/dashboard/src/app/page.tsx
git commit -m "feat(dashboard): add configuration view with sections"
```

---

## Task 12: Command Palette

**Files:**
- Create: `apps/dashboard/src/components/command-palette/command-palette.tsx`
- Modify: `apps/dashboard/src/components/layout/shell.tsx`

**Step 1: Create command-palette.tsx**

```tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  ChatCircle,
  Terminal,
  Lightning,
  List,
  Gear,
  ArrowRight,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface Command {
  id: string
  label: string
  description?: string
  icon: typeof ChatCircle
  action: () => void
  shortcut?: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (view: string) => void
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = useMemo(
    () => [
      {
        id: "chat",
        label: "Go to Chat",
        description: "Open the chat interface",
        icon: ChatCircle,
        action: () => onNavigate("chat"),
        shortcut: "G C",
      },
      {
        id: "cli",
        label: "Go to CLI",
        description: "Open the CLI terminal",
        icon: Terminal,
        action: () => onNavigate("cli"),
        shortcut: "G T",
      },
      {
        id: "processes",
        label: "Go to Processes",
        description: "View running processes",
        icon: Lightning,
        action: () => onNavigate("processes"),
        shortcut: "G P",
      },
      {
        id: "skills",
        label: "Go to Skills",
        description: "Browse available skills",
        icon: List,
        action: () => onNavigate("skills"),
        shortcut: "G S",
      },
      {
        id: "config",
        label: "Go to Config",
        description: "Manage configuration",
        icon: Gear,
        action: () => onNavigate("config"),
        shortcut: "G ,",
      },
    ],
    [onNavigate]
  )

  const filteredCommands = useMemo(() => {
    if (!search) return commands
    const lower = search.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.description?.toLowerCase().includes(lower)
    )
  }, [commands, search])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedIndex(0)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onOpenChange(false)
        }
        break
      case "Escape":
        e.preventDefault()
        onOpenChange(false)
        break
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 pt-[20vh]"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <MagnifyingGlass size={18} className="text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No commands found
                </p>
              ) : (
                filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action()
                      onOpenChange(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <cmd.icon size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cmd.label}</p>
                      {cmd.description && (
                        <p className="text-xs text-muted-foreground">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <ArrowRight size={14} className="text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Update shell.tsx to include CommandPalette**

```tsx
"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { CommandPalette } from "@/components/command-palette/command-palette"

interface ShellProps {
  children: (activeView: string) => ReactNode
}

export function Shell({ children }: ShellProps) {
  const [activeView, setActiveView] = useState("chat")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 overflow-auto p-4">
          {children(activeView)}
        </main>
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={(view) => {
          setActiveView(view)
          setCommandPaletteOpen(false)
        }}
      />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/command-palette/ apps/dashboard/src/components/layout/shell.tsx
git commit -m "feat(dashboard): add command palette with keyboard navigation"
```

---

## Task 13: Mobile Responsive Layout

**Files:**
- Modify: `apps/dashboard/src/components/layout/sidebar.tsx`
- Modify: `apps/dashboard/src/components/layout/shell.tsx`
- Create: `apps/dashboard/src/components/layout/mobile-nav.tsx`

**Step 1: Create mobile-nav.tsx**

```tsx
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
              "flex flex-col items-center gap-1 px-3 py-2 transition-colors",
              activeView === item.id
                ? "text-accent"
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
                className="absolute bottom-0 h-0.5 w-12 bg-accent"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
```

**Step 2: Update shell.tsx for mobile**

```tsx
"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { MobileNav } from "./mobile-nav"
import { CommandPalette } from "@/components/command-palette/command-palette"

interface ShellProps {
  children: (activeView: string) => ReactNode
}

export function Shell({ children }: ShellProps) {
  const [activeView, setActiveView] = useState("chat")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-4">
          {children(activeView)}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav activeView={activeView} onViewChange={setActiveView} />

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={(view) => {
          setActiveView(view)
          setCommandPaletteOpen(false)
        }}
      />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/layout/
git commit -m "feat(dashboard): add mobile-first responsive layout"
```

---

## Task 14: Final Integration and Testing

**Files:**
- Modify: `apps/dashboard/src/app/page.tsx` (final cleanup)
- Create: `apps/dashboard/.env.example`
- Create: `apps/dashboard/README.md`

**Step 1: Finalize page.tsx**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Shell } from "@/components/layout/shell"
import { ConnectionDialog } from "@/components/dialogs/connection-dialog"
import { ChatView } from "@/components/chat/chat-view"
import { CLIView } from "@/components/cli/cli-view"
import { ProcessesView } from "@/components/processes/processes-view"
import { SkillsView } from "@/components/skills/skills-view"
import { ConfigView } from "@/components/config/config-view"
import { useGateway } from "@/lib/gateway/hooks"

export default function Home() {
  const { connected } = useGateway()
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)

  useEffect(() => {
    if (!connected) {
      const timer = setTimeout(() => {
        setConnectionDialogOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [connected])

  return (
    <>
      <Shell>
        {(activeView) => {
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
              return <ConfigView />
            default:
              return <ChatView />
          }
        }}
      </Shell>
      <ConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
      />
    </>
  )
}
```

**Step 2: Create .env.example**

```bash
# Gateway connection
NEXT_PUBLIC_GATEWAY_URL=http://localhost:18789
NEXT_PUBLIC_GATEWAY_TOKEN=your-gateway-token

# Optional: Override at runtime
# GATEWAY_URL=https://gateway.example.com
```

**Step 3: Create README.md**

```markdown
# Sky64 Dashboard

Modern web dashboard for Sky64 agent orchestration system.

## Features

- Real-time chat interface
- CLI terminal
- Process monitoring
- Skills browser
- Configuration management
- Command palette (⌘K)
- Mobile-first responsive design

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS 4
- Framer Motion
- Phosphor Icons
- WebSocket RPC

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Deployment

Built for Cloudflare Pages with static export.

```bash
pnpm build
# Output in `out/` directory
```

## Configuration

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_GATEWAY_URL` - Gateway WebSocket URL
- `NEXT_PUBLIC_GATEWAY_TOKEN` - Authentication token
```

**Step 4: Run build to verify**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build completes successfully

**Step 5: Commit**

```bash
git add apps/dashboard/
git commit -m "feat(dashboard): complete Sky64 dashboard MVP"
```

---

## Summary

This plan creates a complete dashboard with:

1. **Task 1**: Project initialization with Next.js 15, Tailwind 4
2. **Task 2**: Gateway client library (WebSocket RPC)
3. **Task 3**: Gateway provider for state management
4. **Task 4**: UI utilities and base components
5. **Task 5**: Shell layout with sidebar navigation
6. **Task 6**: Connection dialog for gateway auth
7. **Task 7**: Chat interface with real-time messaging
8. **Task 8**: CLI terminal interface
9. **Task 9**: Processes view with status cards
10. **Task 10**: Skills list with search
11. **Task 11**: Configuration view with sections
12. **Task 12**: Command palette (⌘K)
13. **Task 13**: Mobile responsive layout
14. **Task 14**: Final integration and testing

Each task is atomic and includes exact file paths, complete code, and commit instructions.
