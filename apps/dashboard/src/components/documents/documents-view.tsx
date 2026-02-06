"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  MagnifyingGlass,
  CaretRight,
  ArrowSquareOut,
  Spinner,
  WarningCircle,
  BookOpen,
  FolderOpen,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { MarkdownRenderer } from "./markdown-renderer"
import {
  fetchDocs,
  type DocSection,
  type DocCategory,
} from "@/lib/docs"

export interface DocumentsViewProps {
  className?: string
}

export function DocumentsView({ className }: DocumentsViewProps) {
  const [categories, setCategories] = useState<DocCategory[]>([])
  const [allSections, setAllSections] = useState<DocSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSection, setActiveSection] = useState<DocSection | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch docs on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchDocs()
        if (cancelled) return
        setCategories(result.categories)
        setAllSections(result.sections)
        // Expand first category by default
        if (result.categories.length > 0) {
          setExpandedCategories(new Set([result.categories[0].slug]))
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load docs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  // Filter sections by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories

    const query = searchQuery.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        sections: cat.sections.filter(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.content.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.sections.length > 0)
  }, [categories, searchQuery])

  const matchCount = useMemo(
    () => filteredCategories.reduce((acc, cat) => acc + cat.sections.length, 0),
    [filteredCategories]
  )

  // Expand all categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCategories(new Set(filteredCategories.map((c) => c.slug)))
    }
  }, [searchQuery, filteredCategories])

  const toggleCategory = useCallback((slug: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }, [])

  const selectSection = useCallback((section: DocSection) => {
    setActiveSection(section)
    // Scroll content to top
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (loading) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <DocsHeader
          sectionCount={0}
          totalCount={0}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <LoadingState />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <DocsHeader
          sectionCount={0}
          totalCount={0}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <ErrorState message={error} />
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <DocsHeader
        sectionCount={matchCount}
        totalCount={allSections.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Table of Contents sidebar */}
        <div className="w-64 xl:w-72 shrink-0 border-r border-border/50 overflow-y-auto docs-toc">
          <nav className="py-2">
            {filteredCategories.map((category) => (
              <CategoryGroup
                key={category.slug}
                category={category}
                expanded={expandedCategories.has(category.slug)}
                onToggle={() => toggleCategory(category.slug)}
                activeSlug={activeSection?.slug}
                onSelect={selectSection}
              />
            ))}
            {filteredCategories.length === 0 && searchQuery && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No docs match &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </nav>
        </div>

        {/* Main content area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeSection ? (
              <motion.div
                key={activeSection.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto px-6 py-6"
              >
                {/* Section header */}
                <div className="mb-6 pb-4 border-b border-border/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-mono mb-1.5">
                        {activeSection.category}
                      </p>
                      <h2 className="text-xl font-semibold text-foreground leading-tight">
                        {activeSection.title}
                      </h2>
                    </div>
                    <a
                      href={activeSection.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs",
                        "text-muted-foreground hover:text-foreground",
                        "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]",
                        "border border-[var(--surface-2-border)]",
                        "transition-all duration-150"
                      )}
                    >
                      <ArrowSquareOut size={12} />
                      View on docs
                    </a>
                  </div>
                </div>

                {/* Rendered content */}
                <MarkdownRenderer content={activeSection.content} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center"
              >
                <WelcomeState totalSections={allSections.length} totalCategories={categories.length} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/**
 * Header with search bar.
 */
function DocsHeader({
  sectionCount,
  totalCount,
  searchQuery,
  onSearchChange,
}: {
  sectionCount: number
  totalCount: number
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <FileText size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">Documents</h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              {totalCount === 0
                ? "Loading..."
                : sectionCount === totalCount
                  ? `${totalCount} articles`
                  : `${sectionCount} of ${totalCount} shown`}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Search documentation..."
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
 * Collapsible category group in the TOC.
 */
function CategoryGroup({
  category,
  expanded,
  onToggle,
  activeSlug,
  onSelect,
}: {
  category: DocCategory
  expanded: boolean
  onToggle: () => void
  activeSlug?: string
  onSelect: (section: DocSection) => void
}) {
  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-2",
          "text-xs font-medium uppercase tracking-wider",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-[var(--surface-2)] transition-colors"
        )}
      >
        <CaretRight
          size={10}
          className={cn("transition-transform duration-150 shrink-0", expanded && "rotate-90")}
        />
        <span className="truncate">{category.name}</span>
        <span className="ml-auto text-[10px] tabular-nums opacity-50">
          {category.sections.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {category.sections.map((section, idx) => {
              const isActive = activeSlug === section.slug
              return (
                <button
                  key={section.slug || `section-${idx}`}
                  type="button"
                  onClick={() => onSelect(section)}
                  className={cn(
                    "w-full text-left px-4 pl-8 py-1.5 text-xs truncate",
                    "transition-colors duration-100",
                    isActive
                      ? "text-amber-500 bg-amber-500/5 border-l-2 border-amber-500 pl-[30px]"
                      : "text-muted-foreground hover:text-foreground hover:bg-[var(--surface-2)]"
                  )}
                  title={section.title}
                >
                  {section.title}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Welcome state when no doc is selected.
 */
function WelcomeState({ totalSections, totalCategories }: { totalSections: number; totalCategories: number }) {
  return (
    <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 max-w-sm">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
        <BookOpen size={28} weight="duotone" className="text-amber-500/60" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">OpenClaw Documentation</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {totalSections} articles across {totalCategories} categories.
          Select a topic from the sidebar to start reading.
        </p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4 text-muted-foreground p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Spinner size={32} className="text-amber-500/60" />
        </motion.div>
        <p className="text-xs font-mono">Loading documentation...</p>
      </motion.div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4 text-muted-foreground p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <WarningCircle size={28} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Failed to Load</p>
          <p className="text-xs mt-1 max-w-[280px]">{message}</p>
        </div>
      </motion.div>
    </div>
  )
}
