import { env } from '@/config/env'
import type { ApiError } from '@/types/api-error'

import type { AnalyticsConnectionStatus } from '../types/analytics.types'

interface ConnectionStatusCardProps {
  connection?: AnalyticsConnectionStatus
  error: ApiError | null
  isLoading: boolean
}

export function ConnectionStatusCard({
  connection,
  error,
  isLoading,
}: ConnectionStatusCardProps) {
  const isConnected = Boolean(connection?.connected) && !error

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Connection status
          </p>
          <h2 className="text-2xl font-semibold text-white">
            {isLoading ? 'Checking backend connection...' : isConnected ? 'Connected' : 'Awaiting credentials'}
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            The frontend talks only to the Nest API at <code>{env.apiBaseUrl}</code>. The
            backend owns the Supabase Postgres connection.
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            isConnected
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-amber-500/15 text-amber-300'
          }`}
        >
          {isConnected ? 'Ready' : 'Needs setup'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Provider</p>
          <p className="mt-2 text-lg font-medium text-slate-100">
            {connection?.provider ?? 'supabase-postgres'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Database</p>
          <p className="mt-2 text-lg font-medium text-slate-100">
            {connection?.database ?? 'Set DATABASE_URL'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Schema</p>
          <p className="mt-2 text-lg font-medium text-slate-100">
            {connection?.schema ?? 'Set DIRECT_URL'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-medium">The backend could not reach Supabase yet.</p>
          <p className="mt-2">{error.message}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-amber-50/90">
            <li>Copy <code>backend/.env.example</code> to <code>backend/.env</code>.</li>
            <li>Paste your Supabase pooled <code>DATABASE_URL</code>.</li>
            <li>Paste your direct <code>DIRECT_URL</code> for Prisma migrations.</li>
          </ol>
        </div>
      ) : null}
    </section>
  )
}
