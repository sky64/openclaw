"use client"

/**
 * App-level GatewayProvider wrapper.
 * Handles localStorage persistence for gateway URL and token.
 */

import { type ReactNode, useEffect, useState } from "react"
import { GatewayProvider as BaseGatewayProvider } from "@/lib/gateway/hooks"

const STORAGE_KEY_URL = "gateway_url"
const STORAGE_KEY_TOKEN = "gateway_token"
const DEFAULT_GATEWAY_URL = "http://localhost:18789"

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

  useEffect(() => {
    setCredentials(getSavedCredentials())
    setMounted(true)
  }, [])

  // During SSR or before hydration, render without auto-connect
  if (!mounted) {
    return (
      <BaseGatewayProvider
        defaultUrl={DEFAULT_GATEWAY_URL}
        autoConnect={false}
      >
        {children}
      </BaseGatewayProvider>
    )
  }

  const { url: savedUrl, token: savedToken } = credentials
  const hasSavedCredentials = Boolean(savedUrl)

  return (
    <BaseGatewayProvider
      defaultUrl={savedUrl ?? DEFAULT_GATEWAY_URL}
      defaultToken={savedToken ?? undefined}
      autoConnect={hasSavedCredentials}
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
