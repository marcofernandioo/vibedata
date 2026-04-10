import { useQuery } from '@tanstack/react-query'

import type { ApiError } from '@/types/api-error'

import { analyticsApi } from '../api/analytics.api'
import { analyticsKeys } from '../api/analytics.keys'
import type { AnalyticsConnectionStatus } from '../types/analytics.types'

export function useAnalyticsConnection() {
  return useQuery<AnalyticsConnectionStatus, ApiError>({
    queryKey: analyticsKeys.connection(),
    queryFn: analyticsApi.getConnectionStatus,
  })
}
