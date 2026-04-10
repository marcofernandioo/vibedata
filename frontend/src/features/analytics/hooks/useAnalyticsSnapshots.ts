import { useQuery } from '@tanstack/react-query'

import type { ApiError } from '@/types/api-error'

import { analyticsApi } from '../api/analytics.api'
import { analyticsKeys } from '../api/analytics.keys'
import type {
  AnalyticsSnapshotQuery,
  PaginatedAnalyticsSnapshots,
} from '../types/analytics.types'

export function useAnalyticsSnapshots(params: AnalyticsSnapshotQuery) {
  return useQuery<PaginatedAnalyticsSnapshots, ApiError>({
    queryKey: analyticsKeys.snapshotList(params),
    queryFn: () => analyticsApi.getSnapshots(params),
  })
}
