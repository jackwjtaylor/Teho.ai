"use client"

import { useSession, authClient } from "@/lib/auth-client"
import { User } from "lucide-react"

export default function LoginButton() {
  const { data: session } = useSession()

  if (session?.user) {
    return (
      <button
        onClick={() => authClient.signOut()}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
      >
        <User className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => authClient.signIn.social({ provider: 'google' })}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
    >
      <User className="w-4 h-4" />
      <span>Sign In</span>
    </button>
  )
} 