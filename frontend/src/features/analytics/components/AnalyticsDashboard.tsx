import { ConnectionStatusCard } from './ConnectionStatusCard'
import { SnapshotsTable } from './SnapshotsTable'
import { useAnalyticsConnection } from '../hooks/useAnalyticsConnection'
import { useAnalyticsSnapshots } from '../hooks/useAnalyticsSnapshots'

export function AnalyticsDashboard() {
  const connectionQuery = useAnalyticsConnection()
  const snapshotsQuery = useAnalyticsSnapshots({ page: 1, pageSize: 5 })

  return (
    <div className="grid gap-6">
      <ConnectionStatusCard
        connection={connectionQuery.data}
        error={connectionQuery.error ?? null}
        isLoading={connectionQuery.isLoading}
      />

      <section className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
        <SnapshotsTable
          error={snapshotsQuery.error ?? null}
          isLoading={snapshotsQuery.isLoading}
          response={snapshotsQuery.data}
        />

        <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300 shadow-2xl shadow-slate-950/30">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Local setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Credential-only handoff
          </h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5">
            <li>
              Copy <code>backend/.env.example</code> to <code>backend/.env</code>.
            </li>
            <li>Paste the Supabase pooled and direct Postgres URLs.</li>
            <li>
              Run <code>npx prisma generate</code> and <code>npx prisma migrate dev --name init</code>{' '}
              in <code>backend</code>.
            </li>
            <li>
              Start the backend with <code>npm run start:dev</code> and the frontend with{' '}
              <code>npm run dev</code>.
            </li>
          </ol>
        </aside>
      </section>
    </div>
  )
}
