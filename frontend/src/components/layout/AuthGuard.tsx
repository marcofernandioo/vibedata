import type { ReactNode } from 'react'
import { Navigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth.store'

export function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
        Checking your session...
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        search={{ redirect: location.href }}
        replace
      />
    )
  }

  return <>{children}</>
}
