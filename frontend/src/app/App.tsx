import { env } from '@/config/env'
import { AnalyticsDashboard } from '@/features/analytics'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Supabase + Prisma
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {env.appName}
            </h1>
            <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
              Fill the backend database URLs, run the Prisma commands, and this
              dashboard will verify the Nest API and Supabase Postgres
              connection through the backend service layer.
            </p>
          </div>
        </header>

        <AnalyticsDashboard />
      </main>
    </div>
  )
}

export default App
