"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui"
import { HeroSection, LoginForm } from "@/components/login"

export default function LoginPage() {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)

  const handleLogin = async (email: string, password: string) => {
    // Simulate login - replace with real auth logic
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // For now, just redirect to dashboard
    // In production, validate credentials against gateway
    if (email && password) {
      setTimeout(() => {
        router.push("/")
      }, 500)
    } else {
      throw new Error("Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section - Hidden on mobile, 60% on desktop */}
      <div className="hidden lg:flex lg:w-[60%] min-h-screen">
        <HeroSection className="flex-1" formRef={formRef} />
      </div>

      {/* Mobile Hero - Compact version */}
      <div className="lg:hidden relative h-[40vh] min-h-[300px] bg-gradient-to-b from-amber-500/5 to-transparent">
        <HeroSection className="h-full scale-75 origin-center" formRef={formRef} />
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <LoginForm ref={formRef} onSubmit={handleLogin} />
      </div>
    </div>
  )
}
