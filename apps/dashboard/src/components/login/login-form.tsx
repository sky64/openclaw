"use client"

import { useState, forwardRef } from "react"
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

export const LoginForm = forwardRef<HTMLDivElement, LoginFormProps>(
  function LoginForm({ onSubmit, className }, ref) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
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
        ref={ref}
        className={cn(
          "w-full max-w-md p-8 rounded-2xl",
          "bg-[var(--surface-1)]/80 backdrop-blur-xl",
          "border border-[var(--surface-1-border)]",
          "shadow-2xl shadow-black/10",
          className
        )}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.5, ease: "easeOut" }}
      >
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
        >
          <motion.div
            className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Hexagon size={28} weight="duotone" className="text-amber-500" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-semibold">SKY64</h1>
            <p className="text-sm text-muted-foreground">Welcome back</p>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
          >
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              <Envelope size={14} className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(
                "w-full px-4 py-3 rounded-xl",
                "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                "transition-all duration-200",
                "hover:border-[var(--surface-3-border)]"
              )}
              disabled={isLoading || success}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9 }}
          >
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              <Lock size={14} className="inline mr-2" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={cn(
                  "w-full px-4 py-3 pr-12 rounded-xl",
                  "bg-[var(--surface-2)] border border-[var(--surface-2-border)]",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                  "transition-all duration-200",
                  "hover:border-[var(--surface-3-border)]"
                )}
                disabled={isLoading || success}
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

          {/* Remember Me */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--surface-3-border)] bg-[var(--surface-2)] text-amber-500 focus:ring-amber-500/20"
                disabled={isLoading || success}
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
            >
              Forgot password?
            </button>
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
              "w-full py-3.5 rounded-xl font-medium text-sm",
              "flex items-center justify-center gap-2",
              "transition-all duration-200",
              success
                ? "bg-green-500 text-white"
                : "bg-amber-500 text-black hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25",
              "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1 }}
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
              <>
                Sign In
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    )
  }
)
