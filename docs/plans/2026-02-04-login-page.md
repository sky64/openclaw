# Login Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a jaw-dropping login page with animated lobster eyes that open on load, a breathing claw icon, and a polished email/password form.

**Architecture:** Split-screen layout (hero left, form right) that stacks on mobile. Hero features SVG lobster eyes that animate open on load and track the form, plus a stylized claw with breathing animation. Form uses existing surface system with glass-morphism and micro-interactions.

**Tech Stack:** Next.js 15, Tailwind CSS 4, Framer Motion, Phosphor Icons, next-themes

---

## Task 1: Create Login Page Route and Basic Structure

**Files:**
- Create: `apps/dashboard/src/app/login/page.tsx`
- Create: `apps/dashboard/src/app/login/layout.tsx`

**Step 1: Create login layout.tsx**

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - SKY64",
  description: "Sign in to your SKY64 dashboard",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
```

**Step 2: Create basic login page.tsx**

```tsx
"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"

export default function LoginPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex bg-background">
        {/* Hero Section */}
        <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/10" />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Hero Section</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground">Login Form</p>
        </div>
      </div>
    </ThemeProvider>
  )
}
```

**Step 3: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/dashboard/src/app/login/
git commit -m "feat(dashboard): add login page route with split-screen layout"
```

---

## Task 2: Create Animated Lobster Eyes Component

**Files:**
- Create: `apps/dashboard/src/components/login/lobster-eyes.tsx`
- Create: `apps/dashboard/src/components/login/index.ts`

**Step 1: Create lobster-eyes.tsx**

```tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useAnimationControls } from "framer-motion"
import { cn } from "@/lib/utils"

interface LobsterEyesProps {
  className?: string
  trackTarget?: React.RefObject<HTMLElement>
}

export function LobsterEyes({ className, trackTarget }: LobsterEyesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [eyeRotation, setEyeRotation] = useState({ left: 0, right: 0 })
  const eyesRef = useRef<HTMLDivElement>(null)
  const leftEyeControls = useAnimationControls()
  const rightEyeControls = useAnimationControls()

  // Open eyes on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Random blink effect
  useEffect(() => {
    if (!isOpen) return

    const blink = async () => {
      await leftEyeControls.start({ scaleY: 0.1, transition: { duration: 0.1 } })
      await leftEyeControls.start({ scaleY: 1, transition: { duration: 0.15 } })
    }

    const blinkBoth = async () => {
      await Promise.all([
        leftEyeControls.start({ scaleY: 0.1, transition: { duration: 0.1 } }),
        rightEyeControls.start({ scaleY: 0.1, transition: { duration: 0.1 } }),
      ])
      await Promise.all([
        leftEyeControls.start({ scaleY: 1, transition: { duration: 0.15 } }),
        rightEyeControls.start({ scaleY: 1, transition: { duration: 0.15 } }),
      ])
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        blinkBoth()
      }
    }, 4000 + Math.random() * 4000)

    return () => clearInterval(interval)
  }, [isOpen, leftEyeControls, rightEyeControls])

  // Track target element
  useEffect(() => {
    if (!trackTarget?.current || !eyesRef.current || !isOpen) return

    const handleMouseMove = () => {
      const target = trackTarget.current
      const eyes = eyesRef.current
      if (!target || !eyes) return

      const targetRect = target.getBoundingClientRect()
      const eyesRect = eyes.getBoundingClientRect()

      const targetCenterX = targetRect.left + targetRect.width / 2
      const targetCenterY = targetRect.top + targetRect.height / 2
      const eyesCenterX = eyesRect.left + eyesRect.width / 2
      const eyesCenterY = eyesRect.top + eyesRect.height / 2

      const angle = Math.atan2(targetCenterY - eyesCenterY, targetCenterX - eyesCenterX)
      const maxRotation = 15
      const rotation = (angle * 180) / Math.PI
      const clampedRotation = Math.max(-maxRotation, Math.min(maxRotation, rotation * 0.3))

      setEyeRotation({
        left: clampedRotation - 5,
        right: clampedRotation + 5,
      })
    }

    // Initial tracking
    handleMouseMove()

    // Update on focus events
    const target = trackTarget.current
    target.addEventListener("focus", handleMouseMove, true)
    target.addEventListener("blur", handleMouseMove, true)

    return () => {
      target.removeEventListener("focus", handleMouseMove, true)
      target.removeEventListener("blur", handleMouseMove, true)
    }
  }, [trackTarget, isOpen])

  return (
    <div
      ref={eyesRef}
      className={cn("flex items-center justify-center gap-16", className)}
    >
      {/* Left Eye */}
      <motion.div
        className="relative"
        animate={leftEyeControls}
        style={{ rotate: eyeRotation.left }}
      >
        {/* Eyelid */}
        <motion.div
          className="absolute inset-0 bg-background z-10 origin-top"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: isOpen ? 0 : 1 }}
          transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
        />
        {/* Eye */}
        <div className="w-20 h-28 rounded-[50%] bg-gradient-to-b from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 flex items-center justify-center overflow-hidden border-4 border-zinc-700 dark:border-zinc-300">
          {/* Iris */}
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50"
            initial={{ scale: 0.8 }}
            animate={{ scale: isOpen ? 1 : 0.8 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {/* Pupil */}
            <motion.div
              className="w-5 h-5 rounded-full bg-black"
              initial={{ scale: 0 }}
              animate={{ scale: isOpen ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
            />
            {/* Glint */}
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80" />
          </motion.div>
        </div>
      </motion.div>

      {/* Right Eye */}
      <motion.div
        className="relative"
        animate={rightEyeControls}
        style={{ rotate: eyeRotation.right }}
      >
        {/* Eyelid */}
        <motion.div
          className="absolute inset-0 bg-background z-10 origin-top"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: isOpen ? 0 : 1 }}
          transition={{ duration: 0.7, ease: "easeInOut", delay: 0.5 }}
        />
        {/* Eye */}
        <div className="w-20 h-28 rounded-[50%] bg-gradient-to-b from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 flex items-center justify-center overflow-hidden border-4 border-zinc-700 dark:border-zinc-300">
          {/* Iris */}
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50"
            initial={{ scale: 0.8 }}
            animate={{ scale: isOpen ? 1 : 0.8 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            {/* Pupil */}
            <motion.div
              className="w-5 h-5 rounded-full bg-black"
              initial={{ scale: 0 }}
              animate={{ scale: isOpen ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 1 }}
            />
            {/* Glint */}
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
```

**Step 2: Create index.ts**

```tsx
export { LobsterEyes } from "./lobster-eyes"
```

**Step 3: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/login/
git commit -m "feat(dashboard): add animated lobster eyes component with tracking"
```

---

## Task 3: Create Animated Claw Icon Component

**Files:**
- Create: `apps/dashboard/src/components/login/lobster-claw.tsx`
- Modify: `apps/dashboard/src/components/login/index.ts`

**Step 1: Create lobster-claw.tsx**

```tsx
"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LobsterClawProps {
  className?: string
  size?: number
}

export function LobsterClaw({ className, size = 200 }: LobsterClawProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.8,
        y: isVisible ? 0 : 20,
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 blur-3xl bg-amber-500/20 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Claw SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="relative z-10"
      >
        {/* Left pincer */}
        <motion.path
          d="M30 50 Q20 35, 25 20 Q30 10, 40 15 Q50 20, 45 35 L40 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-amber-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isVisible ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.path
          d="M30 50 Q20 35, 25 20 Q30 10, 40 15 Q50 20, 45 35 L40 50"
          fill="url(#clawGradient)"
          opacity="0.3"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 0.3 : 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        />

        {/* Right pincer */}
        <motion.path
          d="M70 50 Q80 35, 75 20 Q70 10, 60 15 Q50 20, 55 35 L60 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-amber-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isVisible ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.path
          d="M70 50 Q80 35, 75 20 Q70 10, 60 15 Q50 20, 55 35 L60 50"
          fill="url(#clawGradient)"
          opacity="0.3"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 0.3 : 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        />

        {/* Base/joint */}
        <motion.ellipse
          cx="50"
          cy="55"
          rx="15"
          ry="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-amber-500"
          initial={{ scale: 0 }}
          animate={{ scale: isVisible ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="clawGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Breathing animation on the whole claw */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />
    </motion.div>
  )
}
```

**Step 2: Update index.ts**

```tsx
export { LobsterEyes } from "./lobster-eyes"
export { LobsterClaw } from "./lobster-claw"
```

**Step 3: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/login/
git commit -m "feat(dashboard): add animated lobster claw SVG component"
```

---

## Task 4: Create Floating Particles Component

**Files:**
- Create: `apps/dashboard/src/components/login/floating-particles.tsx`
- Modify: `apps/dashboard/src/components/login/index.ts`

**Step 1: Create floating-particles.tsx**

```tsx
"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FloatingParticlesProps {
  count?: number
  className?: string
}

export function FloatingParticles({
  count = 12,
  className,
}: FloatingParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    }))
  }, [count])

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-amber-500"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            scale: [0, 1, 1, 0],
            y: [0, -30, -60, -90],
            x: [0, Math.random() * 20 - 10, Math.random() * 40 - 20, Math.random() * 60 - 30],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
```

**Step 2: Update index.ts**

```tsx
export { LobsterEyes } from "./lobster-eyes"
export { LobsterClaw } from "./lobster-claw"
export { FloatingParticles } from "./floating-particles"
```

**Step 3: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/login/
git commit -m "feat(dashboard): add floating particles ambient effect"
```

---

## Task 5: Create Login Form Component

**Files:**
- Create: `apps/dashboard/src/components/login/login-form.tsx`
- Modify: `apps/dashboard/src/components/login/index.ts`

**Step 1: Create login-form.tsx**

```tsx
"use client"

import { useState, forwardRef } from "react"
import { motion } from "framer-motion"
import { Envelope, Lock, Eye, EyeSlash, Hexagon, CircleNotch, Check } from "@phosphor-icons/react"
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
```

**Step 2: Update index.ts**

```tsx
export { LobsterEyes } from "./lobster-eyes"
export { LobsterClaw } from "./lobster-claw"
export { FloatingParticles } from "./floating-particles"
export { LoginForm } from "./login-form"
```

**Step 3: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/login/
git commit -m "feat(dashboard): add login form with micro-interactions"
```

---

## Task 6: Create Hero Section Component

**Files:**
- Create: `apps/dashboard/src/components/login/hero-section.tsx`
- Modify: `apps/dashboard/src/components/login/index.ts`

**Step 1: Create hero-section.tsx**

```tsx
"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LobsterEyes } from "./lobster-eyes"
import { LobsterClaw } from "./lobster-claw"
import { FloatingParticles } from "./floating-particles"

interface HeroSectionProps {
  className?: string
  formRef?: React.RefObject<HTMLElement>
}

export function HeroSection({ className, formRef }: HeroSectionProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/10" />

      {/* Subtle grid pattern - dark mode only */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexGrid" width="50" height="43.4" patternUnits="userSpaceOnUse">
              <path
                d="M25 0 L50 14.4 L50 38.4 L25 52.8 L0 38.4 L0 14.4 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-amber-500"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGrid)" />
        </svg>
      </div>

      {/* Floating particles */}
      <FloatingParticles count={15} />

      {/* Eyes - positioned at top */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2">
        <LobsterEyes trackTarget={formRef as React.RefObject<HTMLElement>} />
      </div>

      {/* Claw */}
      <div className="relative z-10 mt-32">
        <LobsterClaw size={180} />
      </div>

      {/* Tagline */}
      <motion.div
        className="relative z-10 mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-bold tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <span className="text-foreground">Your AI.</span>{" "}
          <span className="text-amber-500">Unleashed.</span>
        </motion.h2>

        {/* Feature bullets */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          {["Multi-channel", "Real-time", "Extensible"].map((feature, i) => (
            <motion.span
              key={feature}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2 + i * 0.1 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {feature}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
```

**Step 2: Update index.ts**

```tsx
export { LobsterEyes } from "./lobster-eyes"
export { LobsterClaw } from "./lobster-claw"
export { FloatingParticles } from "./floating-particles"
export { LoginForm } from "./login-form"
export { HeroSection } from "./hero-section"
```

**Step 3: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/login/
git commit -m "feat(dashboard): add hero section with eyes, claw, and tagline"
```

---

## Task 7: Assemble Complete Login Page

**Files:**
- Modify: `apps/dashboard/src/app/login/page.tsx`

**Step 1: Update login page.tsx with all components**

```tsx
"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ThemeToggle } from "@/components/ui"
import { HeroSection, LoginForm } from "@/components/login"

export default function LoginPage() {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)

  const handleLogin = async (email: string, password: string) => {
    // Simulate login - replace with real auth logic
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // For now, just redirect to dashboard
    // In production, validate credentials against gateway
    if (email && password) {
      setTimeout(() => {
        router.push("/")
      }, 500)
    } else {
      throw new Error("Invalid credentials")
    }
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background">
        {/* Theme Toggle - Fixed position */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Hero Section - Hidden on mobile, 60% on desktop */}
        <div className="hidden lg:flex lg:w-[60%] min-h-screen">
          <HeroSection className="flex-1" formRef={formRef} />
        </div>

        {/* Mobile Hero - Compact version */}
        <div className="lg:hidden relative h-[40vh] min-h-[300px] bg-gradient-to-b from-amber-500/5 to-transparent">
          <HeroSection className="h-full scale-75 origin-center" formRef={formRef} />
        </div>

        {/* Form Section */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <LoginForm ref={formRef} onSubmit={handleLogin} />
        </div>
      </div>
    </ThemeProvider>
  )
}
```

**Step 2: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/dashboard/src/app/login/
git commit -m "feat(dashboard): assemble complete login page with all animations"
```

---

## Task 8: Add Reduced Motion Support and Polish

**Files:**
- Modify: `apps/dashboard/src/components/login/lobster-eyes.tsx`
- Modify: `apps/dashboard/src/components/login/lobster-claw.tsx`
- Modify: `apps/dashboard/src/components/login/floating-particles.tsx`

**Step 1: Add useReducedMotion hook usage to lobster-eyes.tsx**

Add at top of component:
```tsx
import { useReducedMotion } from "framer-motion"

// Inside component:
const prefersReducedMotion = useReducedMotion()
```

Then wrap animations with conditions:
```tsx
// For blink interval, add check:
if (prefersReducedMotion) return
```

**Step 2: Add reduced motion to lobster-claw.tsx**

```tsx
import { useReducedMotion } from "framer-motion"

// Inside component:
const prefersReducedMotion = useReducedMotion()

// Disable breathing animation if reduced motion:
animate={prefersReducedMotion ? {} : { scale: [1, 1.02, 1] }}
```

**Step 3: Add reduced motion to floating-particles.tsx**

```tsx
import { useReducedMotion } from "framer-motion"

// Inside component:
const prefersReducedMotion = useReducedMotion()

// Return null if reduced motion:
if (prefersReducedMotion) return null
```

**Step 4: Verify build**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/dashboard/src/components/login/
git commit -m "feat(dashboard): add reduced motion support for accessibility"
```

---

## Task 9: Final Testing and Cleanup

**Step 1: Run dev server**

Run: `cd /home/kennethdixon/projects/openclaw/apps/dashboard && pnpm dev`

**Step 2: Manual testing checklist**

- [ ] Navigate to /login
- [ ] Eyes open animation plays
- [ ] Eyes track toward form when focused
- [ ] Eyes blink periodically
- [ ] Claw appears with draw animation
- [ ] Claw has breathing glow
- [ ] Particles float around
- [ ] Form slides in
- [ ] Input focus states work
- [ ] Password show/hide works
- [ ] Submit shows loading state
- [ ] Submit shows success state
- [ ] Theme toggle works
- [ ] Mobile layout stacks correctly
- [ ] Reduced motion: animations disabled

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(dashboard): complete jaw-dropping login page with animated lobster"
```

---

## Summary

This plan implements:

1. **Animated Lobster Eyes** - Open on load, track the form, blink randomly
2. **Breathing Claw Icon** - SVG with draw animation and glow
3. **Floating Particles** - Ambient amber particles
4. **Login Form** - Email/password with micro-interactions
5. **Hero Section** - Assembles all visual elements with tagline
6. **Complete Page** - Split-screen layout, mobile responsive
7. **Accessibility** - Reduced motion support throughout

Total: 9 tasks, ~8 files created/modified
