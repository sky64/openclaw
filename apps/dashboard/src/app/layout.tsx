import type { Metadata } from "next"
import { GatewayProvider } from "@/components/providers/gateway-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "SKY64 | Agent Orchestration System",
  description: "Terminal Noir dashboard for AI agent orchestration",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <GatewayProvider>{children}</GatewayProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
