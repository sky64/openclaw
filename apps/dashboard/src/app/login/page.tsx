"use client"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/10" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Hero Section</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground">Login Form</p>
      </div>
    </div>
  )
}
