import type { AnalyticsSnapshotQuery } from '../types/analytics.types'

export const analyticsKeys = {
  all: ['analytics'] as const,
  connection: () => [...analyticsKeys.all, 'connection'] as const,
  snapshots: () => [...analyticsKeys.all, 'snapshots'] as const,
  snapshotList: (params: AnalyticsSnapshotQuery) =>
    [...analyticsKeys.snapshots(), params] as const,
}
