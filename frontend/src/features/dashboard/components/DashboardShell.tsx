import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/layout/NavLink'

export function DashboardHomePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your auth foundation is live. The next step is to connect this shell to real analytics
          queries behind the authenticated backend.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
          <p className="mt-2 text-sm font-medium text-foreground">{user?.email}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Provider-ready</p>
          <p className="mt-2 text-sm font-medium text-foreground">Google OAuth + email/password</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Backend status</p>
          <p className="mt-2 text-sm font-medium text-foreground">JWT guard + local user sync</p>
        </div>
      </div>
    </section>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">Vibedata</p>
            <p className="text-xs text-muted-foreground">
              OAuth foundation with Supabase + NestJS guards
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name ?? user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <Button variant="outline" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-4">
          <nav className="space-y-2">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </nav>
        </aside>

        <main className="rounded-2xl border border-border bg-card p-6">{children}</main>
      </div>
    </div>
  )
}
