"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  Hexagon,
  CircleNotch,
  Check,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>
  className?: string
}

export function LoginForm({ onSubmit, className }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSubmit?.(email, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className={cn(
        "w-full max-w-md p-8 rounded-2xl",
        "bg-[var(--surface-1)]/80 backdrop-blur-xl",
        "border border-[var(--surface-1-border)]",
        "shadow-2xl shadow-black/10",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header - inspired by Browser Cash reference */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-6">
          <Hexagon size={24} weight="duotone" className="text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to{" "}
          <span className="text-amber-500">SKY64</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your agents and sessions.
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            Email
          </label>
          <div className="relative">
            <Envelope
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl",
                "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                "transition-all duration-200",
                "hover:border-[var(--surface-3-border)]"
              )}
              disabled={isLoading || success}
              suppressHydrationWarning
            />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={cn(
                "w-full pl-10 pr-12 py-3 rounded-xl",
                "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                "transition-all duration-200",
                "hover:border-[var(--surface-3-border)]"
              )}
              disabled={isLoading || success}
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading || success}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wide",
            "flex items-center justify-center gap-2",
            "transition-all duration-200",
            success
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-black hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25",
            "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <CircleNotch size={20} className="animate-spin" />
          ) : success ? (
            <>
              <Check size={20} weight="bold" />
              Success!
            </>
          ) : (
            "Log In"
          )}
        </motion.button>

        {/* Footer links */}
        <motion.div
          className="flex items-center justify-between text-sm pt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-muted-foreground">
            Don&apos;t have an account?
          </span>
          <button
            type="button"
            className="text-amber-500 hover:text-amber-400 transition-colors font-medium"
          >
            Forgot password?
          </button>
        </motion.div>
      </form>
    </motion.div>
  )
}
