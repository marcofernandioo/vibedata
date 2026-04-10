import type { ApiError } from '@/types/api-error'

import type { PaginatedAnalyticsSnapshots } from '../types/analytics.types'

interface SnapshotsTableProps {
  error: ApiError | null
  isLoading: boolean
  response?: PaginatedAnalyticsSnapshots
}

export function SnapshotsTable({
  error,
  isLoading,
  response,
}: SnapshotsTableProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Analytics snapshots
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Backend-backed pagination
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          {response
            ? `${response.meta.total} total row${response.meta.total === 1 ? '' : 's'}`
            : 'No rows yet'}
        </p>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-300">Loading snapshot data...</p>
      ) : error ? (
        <p className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error.message}
        </p>
      ) : response && response.data.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/70 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Visitors</th>
                <th className="px-4 py-3 font-medium">Signups</th>
                <th className="px-4 py-3 font-medium">Captured at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-100">
              {response.data.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td className="px-4 py-3">{snapshot.label}</td>
                  <td className="px-4 py-3">{snapshot.visitors.toLocaleString()}</td>
                  <td className="px-4 py-3">{snapshot.signups.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(snapshot.capturedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
          <p className="font-medium text-slate-100">The table is ready, but there is no data yet.</p>
          <p className="mt-2">
            Once the Supabase URLs are configured and the Prisma migration runs, the API can
            return rows from <code>analytics_snapshots</code> without changing the frontend.
          </p>
        </div>
      )}
    </section>
  )
}
