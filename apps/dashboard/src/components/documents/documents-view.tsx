"use client"

import { motion } from "framer-motion"
import { FileText, FolderOpen } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface DocumentsViewProps {
  className?: string
}

export function DocumentsView({ className }: DocumentsViewProps) {
  return (
    <div className={cn("h-full flex flex-col p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
          <FileText size={20} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Agent documentation and resources
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4 text-muted-foreground p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] border border-[var(--surface-2-border)] flex items-center justify-center">
            <FolderOpen size={40} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground">Coming Soon</p>
            <p className="text-xs mt-1 max-w-[280px] text-muted-foreground">
              Documentation and resources will be available here
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
