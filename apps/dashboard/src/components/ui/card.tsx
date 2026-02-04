"use client"

import { forwardRef, type HTMLAttributes, type ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface CardProps {
  accentPosition?: "top" | "left" | "none"
  interactive?: boolean
  children?: ReactNode
  className?: string
  onClick?: () => void
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, accentPosition = "top", interactive = false, children, onClick }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-lg",
          "bg-zinc-950/80 backdrop-blur-sm",
          "border border-border/50",
          interactive && "cursor-pointer",
          className
        )}
        onClick={onClick}
        whileHover={
          interactive
            ? {
                y: -2,
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
              }
            : undefined
        }
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Amber accent line */}
        {accentPosition === "top" && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        )}
        {accentPosition === "left" && (
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-accent/50 to-transparent" />
        )}
        {children}
      </motion.div>
    )
  }
)

Card.displayName = "Card"

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-4 pb-2", className)}
        {...props}
      />
    )
  }
)

CardHeader.displayName = "CardHeader"

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "font-mono text-sm font-medium tracking-wide text-foreground",
          "uppercase",
          className
        )}
        {...props}
      />
    )
  }
)

CardTitle.displayName = "CardTitle"

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-4 pt-2", className)} {...props} />
  }
)

CardContent.displayName = "CardContent"
