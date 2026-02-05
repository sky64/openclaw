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
