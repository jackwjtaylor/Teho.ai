"use client"

import { useSession, authClient } from "@/lib/auth-client"
import { User } from "lucide-react"

export default function LoginButton() {
  const { data: session } = useSession()

  if (session?.user) {
    return (
      <button
        onClick={() => authClient.signOut()}
        className="h-8 px-3 rounded-full bg-white dark:bg-[#131316] flex items-center gap-2 shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24),0px_0px_0px_1px_rgba(0,0,0,1.00),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] transition-colors duration-200"
      >
        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-900 dark:text-white">Sign Out</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => authClient.signIn.social({ provider: 'google' })}
      className="h-8 px-3 rounded-full bg-white dark:bg-[#131316] flex items-center gap-2 shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24),0px_0px_0px_1px_rgba(0,0,0,1.00),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] transition-colors duration-200"
    >
      <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <span className="text-sm text-gray-900 dark:text-white">Sign In</span>
    </button>
  )
}