"use client"

import { forwardRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type ButtonVariant = "default" | "ghost" | "outline" | "destructive"
export type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
  className?: string
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  onClick?: () => void
  "aria-label"?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  default: cn(
    "bg-accent text-accent-foreground font-medium",
    "shadow-[0_0_0_1px_rgba(245,158,11,0.3)]",
    "hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    "active:shadow-[0_0_10px_rgba(245,158,11,0.5)]"
  ),
  ghost: cn(
    "bg-transparent text-foreground",
    "hover:bg-muted/50",
    "active:bg-muted"
  ),
  outline: cn(
    "bg-transparent text-foreground",
    "border border-border",
    "hover:border-accent hover:text-accent",
    "active:bg-accent/10"
  ),
  destructive: cn(
    "bg-red-950/50 text-red-400 border border-red-900/50",
    "hover:bg-red-950 hover:border-red-800",
    "hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    "active:shadow-[0_0_10px_rgba(239,68,68,0.4)]"
  ),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-10 w-10 p-0",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      disabled,
      children,
      type = "button",
      onClick,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-md font-mono",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = "Button"
