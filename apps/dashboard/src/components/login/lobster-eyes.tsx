"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useAnimationControls, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LobsterEyesProps {
  className?: string
  trackTarget?: React.RefObject<HTMLElement | null>
}

export function LobsterEyes({ className, trackTarget }: LobsterEyesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [eyeRotation, setEyeRotation] = useState({ left: 0, right: 0 })
  const eyesRef = useRef<HTMLDivElement>(null)
  const leftEyeControls = useAnimationControls()
  const rightEyeControls = useAnimationControls()
  const prefersReducedMotion = useReducedMotion()

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
    if (prefersReducedMotion) return

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
  }, [isOpen, leftEyeControls, rightEyeControls, prefersReducedMotion])

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

    handleMouseMove()

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
        {/* Eye - just the gold iris */}
        <motion.div
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50"
          initial={{ scale: 0.8 }}
          animate={{ scale: isOpen ? 1 : 0.8 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Pupil */}
          <motion.div
            className="w-6 h-6 rounded-full bg-zinc-950"
            initial={{ scale: 0 }}
            animate={{ scale: isOpen ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          />
          {/* Glint */}
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-200/60" />
        </motion.div>
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
        {/* Eye - just the gold iris */}
        <motion.div
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50"
          initial={{ scale: 0.8 }}
          animate={{ scale: isOpen ? 1 : 0.8 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {/* Pupil */}
          <motion.div
            className="w-6 h-6 rounded-full bg-zinc-950"
            initial={{ scale: 0 }}
            animate={{ scale: isOpen ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 1 }}
          />
          {/* Glint */}
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-200/60" />
        </motion.div>
      </motion.div>
    </div>
  )
}
