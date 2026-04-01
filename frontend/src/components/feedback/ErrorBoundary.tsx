import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error instanceof Error ? error.message : 'An unexpected error occurred.'}
      </p>
      <Button variant="outline" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  )
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>{children}</ReactErrorBoundary>
  )
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload()
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
