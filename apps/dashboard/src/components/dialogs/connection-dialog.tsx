"use client"

import { useState, useEffect, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plugs, CircleNotch, Warning } from "@phosphor-icons/react"
import { useGateway } from "@/lib/gateway/hooks"
import { saveGatewayCredentials } from "@/components/providers/gateway-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DEFAULT_GATEWAY_URL = "http://localhost:18789"

export interface ConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectionDialog({ open, onOpenChange }: ConnectionDialogProps) {
  const { connect, connected, error: gatewayError } = useGateway()

  const [url, setUrl] = useState(DEFAULT_GATEWAY_URL)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-close on successful connection
  useEffect(() => {
    if (connected && open) {
      onOpenChange(false)
    }
  }, [connected, open, onOpenChange])

  // Sync gateway error to local state
  useEffect(() => {
    if (gatewayError) {
      setError(gatewayError.message)
      setLoading(false)
    }
  }, [gatewayError])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await connect(url, token || undefined)
      // Save credentials on success
      saveGatewayCredentials(url, token || undefined)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="relative w-full max-w-md shadow-2xl">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Plugs className="h-5 w-5 text-accent" weight="duotone" />
                  </div>
                  <CardTitle className="text-base">Connect to Gateway</CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Gateway URL */}
                  <div className="space-y-2">
                    <label
                      htmlFor="gateway-url"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                    >
                      Gateway URL
                    </label>
                    <Input
                      id="gateway-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={DEFAULT_GATEWAY_URL}
                      disabled={loading}
                      mono
                      autoComplete="url"
                    />
                  </div>

                  {/* Auth Token */}
                  <div className="space-y-2">
                    <label
                      htmlFor="auth-token"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                    >
                      Auth Token
                      <span className="ml-2 text-muted-foreground/60 normal-case">
                        (optional)
                      </span>
                    </label>
                    <Input
                      id="auth-token"
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Enter token if required"
                      disabled={loading}
                      mono
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-md",
                        "bg-red-950/30 border border-red-900/50",
                        "text-sm text-red-400"
                      )}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Warning className="h-4 w-4 flex-shrink-0 mt-0.5" weight="fill" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !url.trim()}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <CircleNotch className="h-4 w-4 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <span>Connect</span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
