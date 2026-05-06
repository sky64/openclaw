/**
 * Skills data and types.
 * Shared between SkillsView and slash command autocomplete.
 */

export interface Skill {
  name: string
  description: string
  category?: string
  invocable?: boolean
}

/**
 * Mock skills data for development.
 * Will be replaced with real skills from the gateway.
 */
export const SKILLS: Skill[] = [
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
 * Get all invocable skills (can be used as slash commands).
 */
export function getInvocableSkills(): Skill[] {
  return SKILLS.filter((skill) => skill.invocable)
}
