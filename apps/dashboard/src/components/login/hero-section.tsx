"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/10" />

      {/* Subtle grid pattern */}
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

      {/* Tagline */}
      <motion.div
        className="relative z-10 text-center px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-bold tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-foreground">Your AI.</span>{" "}
          <span className="text-amber-500">Unleashed.</span>
        </motion.h2>

        {/* Feature bullets */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {["Multi-channel", "Real-time", "Extensible"].map((feature, i) => (
            <motion.span
              key={feature}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
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
