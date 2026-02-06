"use client"

const DOCS_URL = "https://docs.openclaw.ai/llms-full.txt"

export interface DocSection {
  /** Section title extracted from first heading */
  title: string
  /** Source URL from the docs site */
  sourceUrl: string
  /** Category slug (e.g., "automation", "channels") */
  category: string
  /** Slug derived from the source path */
  slug: string
  /** Raw markdown content (everything after the Source: line) */
  content: string
}

export interface DocCategory {
  name: string
  slug: string
  sections: DocSection[]
}

const CATEGORY_LABELS: Record<string, string> = {
  automation: "Automation",
  bedrock: "AWS Bedrock",
  "broadcast-groups": "Broadcast Groups",
  channels: "Channels",
  cli: "CLI",
  concepts: "Concepts",
  debugging: "Debugging",
  environment: "Environment",
  gateway: "Gateway",
  help: "Help",
  hooks: "Hooks",
  index: "Overview",
  install: "Installation",
  "multi-agent-sandbox-tools": "Multi-Agent Sandbox",
  nodes: "Nodes",
  platforms: "Platforms",
  plugin: "Plugins",
  plugins: "Plugins",
  providers: "Providers",
  reference: "Reference",
  scripts: "Scripts",
  security: "Security",
  start: "Getting Started",
  testing: "Testing",
  "token-use": "Token Usage",
  tools: "Tools",
  tui: "TUI",
  web: "Web",
}

/**
 * Parse the llms-full.txt file into structured sections.
 * Sections are delimited by lines matching `# Title\nSource: URL`.
 */
export function parseDocs(raw: string): DocSection[] {
  const sections: DocSection[] = []
  const lines = raw.split("\n")

  let i = 0
  while (i < lines.length) {
    // Look for a Source: line which marks the start of a section
    if (lines[i]?.startsWith("Source: https://docs.openclaw.ai/")) {
      const sourceUrl = lines[i].replace("Source: ", "").trim()
      const path = sourceUrl.replace("https://docs.openclaw.ai/", "")
      const parts = path.split("/")
      const category = parts[0] || "other"
      const slug = parts.slice(1).join("/") || parts[0]

      // The title is the line before Source:
      const title = (lines[i - 1] || "")
        .replace(/^#+\s*/, "")
        .trim()

      // Collect content until the next section (next title + Source: pair)
      i += 1
      const contentLines: string[] = []
      while (i < lines.length) {
        // Check if this line is a Source: line preceded by a # Title line
        if (
          lines[i]?.startsWith("Source: https://docs.openclaw.ai/") &&
          i > 0 &&
          lines[i - 1]?.startsWith("# ")
        ) {
          // Back up to exclude the title line we just consumed
          contentLines.pop()
          i -= 1
          break
        }
        contentLines.push(lines[i])
        i += 1
      }

      const content = contentLines.join("\n").trim()
      if (title && content) {
        sections.push({ title, sourceUrl, category, slug, content })
      }
    } else {
      i += 1
    }
  }

  return sections
}

/**
 * Group parsed sections into categories.
 */
export function groupByCategory(sections: DocSection[]): DocCategory[] {
  const categoryMap = new Map<string, DocSection[]>()

  for (const section of sections) {
    const existing = categoryMap.get(section.category) ?? []
    existing.push(section)
    categoryMap.set(section.category, existing)
  }

  // Sort categories: "start" and "concepts" first, then alphabetical
  const priorityOrder = ["start", "concepts", "install", "gateway", "channels"]

  return Array.from(categoryMap.entries())
    .sort(([a], [b]) => {
      const aIdx = priorityOrder.indexOf(a)
      const bIdx = priorityOrder.indexOf(b)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return a.localeCompare(b)
    })
    .map(([slug, sections]) => ({
      name: CATEGORY_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1),
      slug,
      sections,
    }))
}

/**
 * Fetch and parse docs from the remote URL.
 */
export async function fetchDocs(): Promise<{
  sections: DocSection[]
  categories: DocCategory[]
}> {
  const response = await fetch(DOCS_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch docs: ${response.status}`)
  }
  const raw = await response.text()
  const sections = parseDocs(raw)
  const categories = groupByCategory(sections)
  return { sections, categories }
}
