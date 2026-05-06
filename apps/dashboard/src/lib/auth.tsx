"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

const AUTH_STORAGE_KEY = "sky64_authenticated"
const AUTH_TIMESTAMP_KEY = "sky64_auth_timestamp"
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") {
        setIsLoading(false)
        return
      }

      try {
        const authenticated = sessionStorage.getItem(AUTH_STORAGE_KEY)
        const timestamp = sessionStorage.getItem(AUTH_TIMESTAMP_KEY)

        if (authenticated === "true" && timestamp) {
          const authTime = parseInt(timestamp, 10)
          const now = Date.now()

          // Check if session has expired
          if (now - authTime < SESSION_DURATION_MS) {
            setIsAuthenticated(true)
          } else {
            // Session expired, clear it
            sessionStorage.removeItem(AUTH_STORAGE_KEY)
            sessionStorage.removeItem(AUTH_TIMESTAMP_KEY)
          }
        }
      } catch {
        // sessionStorage may be blocked
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, "true")
      sessionStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString())
      setIsAuthenticated(true)
    } catch {
      // sessionStorage may be blocked
    }
  }, [])

  const logout = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      sessionStorage.removeItem(AUTH_TIMESTAMP_KEY)
      setIsAuthenticated(false)
    } catch {
      // sessionStorage may be blocked
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
