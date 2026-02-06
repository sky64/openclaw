"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Lightweight markdown renderer for documentation content.
 * Handles headings, code blocks, inline code, links, bold, italic,
 * lists, blockquotes, and tables.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = useMemo(() => renderMarkdown(content), [content])

  return (
    <div
      className={cn("docs-prose", className)}
      // biome-ignore lint: doc content is from our own docs site
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderInline(text: string): string {
  let result = escapeHtml(text)

  // Inline code (must come before bold/italic)
  result = result.replace(/`([^`]+)`/g, '<code class="docs-inline-code">$1</code>')

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

  // Italic
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="docs-link">$1</a>'
  )

  return result
}

function renderMarkdown(raw: string): string {
  const lines = raw.split("\n")
  const output: string[] = []
  let i = 0
  let inList = false
  let listType: "ul" | "ol" = "ul"
  let inTable = false
  let inBlockquote = false

  function closeList() {
    if (inList) {
      output.push(`</${listType}>`)
      inList = false
    }
  }

  function closeTable() {
    if (inTable) {
      output.push("</tbody></table></div>")
      inTable = false
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      output.push("</blockquote>")
      inBlockquote = false
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code blocks
    if (line.startsWith("```")) {
      closeList()
      closeTable()
      closeBlockquote()
      const lang = line.slice(3).split(/\s/)[0] || ""
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i += 1
      }
      i += 1 // skip closing ```
      const code = escapeHtml(codeLines.join("\n"))
      const langLabel = lang && !lang.includes("{") ? lang : ""
      output.push(
        `<div class="docs-code-block">` +
          (langLabel
            ? `<div class="docs-code-lang">${escapeHtml(langLabel)}</div>`
            : "") +
          `<pre><code>${code}</code></pre></div>`
      )
      continue
    }

    // Blockquotes
    if (line.startsWith("> ") || line === ">") {
      closeList()
      closeTable()
      if (!inBlockquote) {
        output.push('<blockquote class="docs-blockquote">')
        inBlockquote = true
      }
      const content = line.replace(/^>\s?/, "")
      output.push(`<p>${renderInline(content)}</p>`)
      i += 1
      continue
    }
    if (inBlockquote && line.trim() !== "") {
      // continuation
    } else {
      closeBlockquote()
    }

    // Tables
    if (line.includes("|") && line.trim().startsWith("|")) {
      closeList()
      closeBlockquote()
      if (!inTable) {
        // Parse header
        const headers = line
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim())
        // Skip separator line
        if (i + 1 < lines.length && lines[i + 1]?.includes("---")) {
          i += 2
        } else {
          i += 1
        }
        output.push(
          '<div class="docs-table-wrap"><table class="docs-table"><thead><tr>' +
            headers.map((h) => `<th>${renderInline(h)}</th>`).join("") +
            "</tr></thead><tbody>"
        )
        inTable = true
        continue
      }
      // Table row
      const cells = line
        .split("|")
        .filter((c) => c.trim())
        .map((c) => c.trim())
      output.push(
        "<tr>" + cells.map((c) => `<td>${renderInline(c)}</td>`).join("") + "</tr>"
      )
      i += 1
      continue
    }
    closeTable()

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/)
    if (headingMatch) {
      closeList()
      const level = headingMatch[1].length
      const text = headingMatch[2]
      const tag = `h${level + 1}` // offset since doc section title is h2
      output.push(`<${tag} class="docs-heading docs-h${level + 1}">${renderInline(text)}</${tag}>`)
      i += 1
      continue
    }

    // Unordered lists
    if (line.match(/^[\s]*[-*]\s+/)) {
      closeTable()
      closeBlockquote()
      const indent = line.search(/[^\s]/)
      if (!inList) {
        output.push('<ul class="docs-list">')
        inList = true
        listType = "ul"
      }
      const content = line.replace(/^[\s]*[-*]\s+/, "")
      output.push(`<li class="docs-li" style="margin-left:${Math.max(0, indent - 2) * 8}px">${renderInline(content)}</li>`)
      i += 1
      continue
    }

    // Ordered lists
    if (line.match(/^[\s]*\d+\.\s+/)) {
      closeTable()
      closeBlockquote()
      if (!inList || listType !== "ol") {
        closeList()
        output.push('<ol class="docs-list docs-ol">')
        inList = true
        listType = "ol"
      }
      const content = line.replace(/^[\s]*\d+\.\s+/, "")
      output.push(`<li class="docs-li">${renderInline(content)}</li>`)
      i += 1
      continue
    }

    // Close list if we hit non-list content
    if (line.trim() !== "") {
      closeList()
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      output.push('<hr class="docs-hr" />')
      i += 1
      continue
    }

    // Empty line
    if (line.trim() === "") {
      i += 1
      continue
    }

    // Paragraph
    output.push(`<p class="docs-p">${renderInline(line)}</p>`)
    i += 1
  }

  closeList()
  closeTable()
  closeBlockquote()

  return output.join("\n")
}
