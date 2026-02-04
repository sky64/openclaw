"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { List, MagnifyingGlass, Sparkle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { SkillCard, type Skill } from "./skill-card"

export interface SkillsViewProps {
  className?: string
}

/**
 * Mock skills data for development.
 * Will be replaced with real skills from the gateway.
 */
const MOCK_SKILLS: Skill[] = [
  {
    name: "commit",
    description: "Create a git commit with a well-formatted message",
    category: "git",
    invocable: true,
  },
  {
    name: "review-pr",
    description: "Review a GitHub pull request and provide feedback",
    category: "git",
    invocable: true,
  },
  {
    name: "brainstorming",
    description: "Explore user intent, requirements and design before implementation",
    category: "planning",
    invocable: true,
  },
  {
    name: "writing-plans",
    description: "Write comprehensive implementation plans for multi-step tasks",
    category: "planning",
    invocable: true,
  },
  {
    name: "test-driven-development",
    description: "Implement features using TDD methodology",
    category: "development",
    invocable: true,
  },
  {
    name: "systematic-debugging",
    description: "Debug issues methodically with hypothesis testing",
    category: "development",
    invocable: true,
  },
  {
    name: "verification-before-completion",
    description: "Run verification commands before claiming work is complete",
    category: "quality",
    invocable: true,
  },
  {
    name: "requesting-code-review",
    description: "Request code review when completing major features",
    category: "quality",
    invocable: true,
  },
]

/**
 * Main skills view component.
 * Displays a searchable grid of skill cards.
 */
export function SkillsView({ className }: SkillsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter skills based on search query
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) {
      return MOCK_SKILLS
    }

    const query = searchQuery.toLowerCase()
    return MOCK_SKILLS.filter(
      (skill) =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.category?.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Handle skill invocation
  const handleInvoke = (name: string) => {
    // In the future, this will invoke the skill via the gateway
    console.log(`Invoking skill: /${name}`)
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <SkillsHeader
        skillCount={filteredSkills.length}
        totalCount={MOCK_SKILLS.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Skills grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredSkills.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredSkills.map((skill) => (
                <motion.div
                  key={skill.name}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <SkillCard skill={skill} onInvoke={handleInvoke} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/**
 * Header component for the skills view.
 */
function SkillsHeader({
  skillCount,
  totalCount,
  searchQuery,
  onSearchChange,
}: {
  skillCount: number
  totalCount: number
  searchQuery: string
  onSearchChange: (query: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-border/50">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <List size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">Skills</h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              {skillCount === totalCount
                ? `${totalCount} available`
                : `${skillCount} of ${totalCount} shown`}
            </p>
          </div>
        </div>
      </div>

      {/* Search input */}
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Search skills by name, description, or category..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
          mono
        />
      </div>
    </div>
  )
}

/**
 * Empty state component when no skills match the search.
 */
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full text-muted-foreground p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Sparkle size={40} weight="duotone" className="text-zinc-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No Skills Found</p>
        <p className="text-xs mt-1 max-w-[280px]">
          No skills match &quot;{query}&quot;. Try a different search term.
        </p>
      </div>
    </motion.div>
  )
}
