"use client"

import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", mono = false, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md px-3 py-2",
          "bg-muted text-foreground",
          "border border-border",
          "text-sm placeholder:text-muted-foreground",
          "transition-all duration-200",
          "focus:outline-none focus:border-accent",
          "focus:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]",
          "focus:ring-1 focus:ring-accent/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          mono && "font-mono",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
