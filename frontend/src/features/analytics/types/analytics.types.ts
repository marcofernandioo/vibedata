export interface AnalyticsConnectionStatus {
  connected: boolean
  provider: 'supabase-postgres'
  database: string
  schema: string
}

export interface AnalyticsSnapshotRecord {
  id: string
  label: string
  visitors: number
  signups: number
  capturedAt: string
}

export interface PaginatedAnalyticsSnapshots {
  data: AnalyticsSnapshotRecord[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

export interface AnalyticsSnapshotQuery {
  page: number
  pageSize: number
}
