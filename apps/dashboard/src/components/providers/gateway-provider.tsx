"use client"

/**
 * App-level GatewayProvider wrapper.
 * Handles localStorage persistence for gateway URL and token.
 * Auto-detects correct gateway URL based on current hostname.
 */

import { type ReactNode, useEffect, useState } from "react"
import { GatewayProvider as BaseGatewayProvider } from "@/lib/gateway/hooks"

const STORAGE_KEY_URL = "gateway_url"
const STORAGE_KEY_TOKEN = "gateway_token"

// Gateway URL mapping based on hostname
const GATEWAY_URL_MAP: Record<string, string> = {
  "dashboard.sky64.io": "wss://api.sky64.io",
  "localhost": "ws://localhost:18789",
  "127.0.0.1": "ws://localhost:18789",
}

// Default token for sky64.io (can be overridden via localStorage)
const DEFAULT_TOKEN = "7d30ebb1155d93284bf0ba16c0e658ff28f6d71e8d39e185"

/**
 * Get the appropriate gateway URL based on current hostname.
 */
function getGatewayUrlForHost(): string {
  if (typeof window === "undefined") {
    return "ws://localhost:18789"
  }

  const hostname = window.location.hostname
  return GATEWAY_URL_MAP[hostname] ?? "ws://localhost:18789"
}

interface AppGatewayProviderProps {
  children: ReactNode
}

/**
 * Read saved gateway credentials from localStorage.
 * Returns null values if not in browser or nothing saved.
 */
function getSavedCredentials(): { url: string | null; token: string | null } {
  if (typeof window === "undefined") {
    return { url: null, token: null }
  }

  try {
    const url = localStorage.getItem(STORAGE_KEY_URL)
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    return { url, token }
  } catch {
    // localStorage may be blocked in some contexts
    return { url: null, token: null }
  }
}

export function GatewayProvider({ children }: AppGatewayProviderProps) {
  // Track hydration to avoid SSR/client mismatch
  const [mounted, setMounted] = useState(false)
  const [credentials, setCredentials] = useState<{
    url: string | null
    token: string | null
  }>({ url: null, token: null })
  const [autoDetectedUrl, setAutoDetectedUrl] = useState<string>("ws://localhost:18789")

  useEffect(() => {
    setCredentials(getSavedCredentials())
    setAutoDetectedUrl(getGatewayUrlForHost())
    setMounted(true)
  }, [])

  // During SSR or before hydration, render without auto-connect
  if (!mounted) {
    return (
      <BaseGatewayProvider
        defaultUrl="ws://localhost:18789"
        autoConnect={false}
      >
        {children}
      </BaseGatewayProvider>
    )
  }

  const { url: savedUrl, token: savedToken } = credentials

  // Use saved URL if available, otherwise use auto-detected URL
  const gatewayUrl = savedUrl ?? autoDetectedUrl

  // Use saved token, or default token for sky64.io domain
  const isPublicDomain = typeof window !== "undefined" && window.location.hostname === "dashboard.sky64.io"
  const gatewayToken = savedToken ?? (isPublicDomain ? DEFAULT_TOKEN : undefined)

  // Auto-connect if we have a token (either saved or default for public domain)
  const shouldAutoConnect = Boolean(gatewayToken)

  return (
    <BaseGatewayProvider
      defaultUrl={gatewayUrl}
      defaultToken={gatewayToken}
      autoConnect={shouldAutoConnect}
    >
      {children}
    </BaseGatewayProvider>
  )
}

/**
 * Save gateway credentials to localStorage.
 * Call this after successful connection.
 */
export function saveGatewayCredentials(url: string, token?: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY_URL, url)
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token)
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN)
    }
  } catch {
    // localStorage may be blocked
  }
}

/**
 * Clear saved gateway credentials from localStorage.
 * Call this on disconnect or logout.
 */
export function clearGatewayCredentials(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY_URL)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
  } catch {
    // localStorage may be blocked
  }
}
