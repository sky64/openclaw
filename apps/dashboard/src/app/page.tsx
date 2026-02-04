"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-amber-900/5" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Status indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "backOut" }}
          className="mb-8 flex items-center gap-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            System Online
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-mono text-6xl md:text-8xl font-bold tracking-[0.3em] text-foreground"
        >
          SKY64
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-6 font-mono text-sm text-muted-foreground tracking-widest uppercase"
        >
          Agent Orchestration System
        </motion.p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 h-px w-32 bg-gradient-to-r from-transparent via-border to-transparent"
        />

        {/* Version badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 px-3 py-1 border border-border rounded-full"
        >
          <span className="font-mono text-xs text-muted-foreground">
            v0.1.0-alpha
          </span>
        </motion.div>
      </motion.div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-8 h-8 border-l border-t border-border opacity-30" />
      <div className="absolute top-8 right-8 w-8 h-8 border-r border-t border-border opacity-30" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-border opacity-30" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-border opacity-30" />
    </main>
  );
}
