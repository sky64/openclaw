import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - SKY64",
  description: "Sign in to your SKY64 dashboard",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
