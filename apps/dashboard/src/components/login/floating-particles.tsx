"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FloatingParticlesProps {
  count?: number
  className?: string
}

export function FloatingParticles({
  count = 12,
  className,
}: FloatingParticlesProps) {
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  // Only render on client to avoid hydration mismatch from Math.random()
  useEffect(() => {
    setMounted(true)
  }, [])

  const particles = useMemo(() => {
    if (!mounted) return []
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
      xDrift: [0, Math.random() * 20 - 10, Math.random() * 40 - 20, Math.random() * 60 - 30],
    }))
  }, [count, mounted])

  if (prefersReducedMotion || !mounted) return null

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
            x: particle.xDrift,
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
