"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Copy, Check, Play } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * Skill data structure representing a skill/command.
 */
export interface Skill {
  name: string
  description: string
  category?: string
  invocable?: boolean
}

export interface SkillCardProps {
  skill: Skill
  onInvoke?: (name: string) => void
  className?: string
}

/**
 * Category color configuration for badges.
 */
const categoryColors: Record<string, string> = {
  git: "bg-violet-950/50 text-violet-400 border-violet-800/50",
  planning: "bg-blue-950/50 text-blue-400 border-blue-800/50",
  development: "bg-emerald-950/50 text-emerald-400 border-emerald-800/50",
  quality: "bg-amber-950/50 text-amber-400 border-amber-800/50",
}

/**
 * Get category badge styles with fallback.
 */
function getCategoryStyles(category: string): string {
  return categoryColors[category.toLowerCase()] || "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
}

/**
 * A card component displaying a single skill.
 * Features monospace skill name, category badge, and action buttons.
 */
export function SkillCard({ skill, onInvoke, className }: SkillCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = `/${skill.name}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInvoke = () => {
    onInvoke?.(skill.name)
  }

  return (
    <Card
      interactive
      className={cn("overflow-hidden transition-shadow duration-300", className)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Skill name as terminal command */}
            <h3 className="font-mono text-sm font-medium tracking-wide text-amber-500">
              /{skill.name}
            </h3>
            {/* Category badge */}
            {skill.category && (
              <Badge
                className={cn(
                  "mt-1.5 text-[10px]",
                  getCategoryStyles(skill.category)
                )}
              >
                {skill.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description with 2-line truncation */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
          {skill.description}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
            aria-label={copied ? "Copied" : "Copy skill command"}
          >
            <motion.span
              className="flex items-center gap-1.5"
              initial={false}
              animate={{ opacity: 1 }}
            >
              {copied ? (
                <>
                  <Check size={14} weight="bold" className="text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </motion.span>
          </Button>

          {skill.invocable && (
            <Button
              variant="default"
              size="sm"
              onClick={handleInvoke}
              className="flex-1"
              aria-label="Run skill"
            >
              <Play size={14} weight="fill" className="mr-1" />
              Run
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
