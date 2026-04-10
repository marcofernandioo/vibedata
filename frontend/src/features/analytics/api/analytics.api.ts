import { apiClient } from '@/lib/axios'

import type {
  AnalyticsConnectionStatus,
  AnalyticsSnapshotQuery,
  PaginatedAnalyticsSnapshots,
} from '../types/analytics.types'

export const analyticsApi = {
  getConnectionStatus: () =>
    apiClient
      .get<AnalyticsConnectionStatus>('/analytics/connection')
      .then((response) => response.data),

  getSnapshots: (params: AnalyticsSnapshotQuery) =>
    apiClient
      .get<PaginatedAnalyticsSnapshots>('/analytics/snapshots', { params })
      .then((response) => response.data),
}
