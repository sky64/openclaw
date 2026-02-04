"use client"

import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "success" | "warning" | "error"

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: cn(
    "bg-zinc-800/80 text-zinc-400",
    "border-zinc-700/50"
  ),
  success: cn(
    "bg-emerald-950/50 text-emerald-400",
    "border-emerald-800/50",
    "shadow-[0_0_10px_rgba(16,185,129,0.15)]"
  ),
  warning: cn(
    "bg-amber-950/50 text-amber-400",
    "border-amber-800/50",
    "shadow-[0_0_10px_rgba(245,158,11,0.15)]"
  ),
  error: cn(
    "bg-red-950/50 text-red-400",
    "border-red-800/50",
    "shadow-[0_0_10px_rgba(239,68,68,0.15)]"
  ),
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center",
          "rounded-full px-2.5 py-0.5",
          "text-xs font-mono font-medium",
          "border",
          "transition-all duration-200",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = "Badge"
