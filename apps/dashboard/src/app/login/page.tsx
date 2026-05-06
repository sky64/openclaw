"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui"
import { HeroSection, LoginForm } from "@/components/login"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, login } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogin = async (_email: string, password: string) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error((data as { error?: string }).error ?? "Invalid password")
    }

    login()

    setTimeout(() => {
      router.push("/")
    }, 500)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section - Desktop only */}
      <div className="hidden lg:flex lg:w-[60%] min-h-screen">
        <HeroSection className="flex-1" />
      </div>

      {/* Form Section - Centered card on mobile, side panel on desktop */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 min-h-screen lg:min-h-0">
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  )
}
