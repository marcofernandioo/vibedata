import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import * as authApi from '../api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

export function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const session = await authApi.completeOAuthCallback()

        if (isMounted) {
          setSession(session)
          await navigate({ to: '/' })
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to complete sign-in callback',
          )
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [navigate, setSession])

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Finishing sign-in
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {errorMessage ?? 'Please wait while we complete your OAuth session.'}
        </p>
      </div>
    </div>
  )
}
