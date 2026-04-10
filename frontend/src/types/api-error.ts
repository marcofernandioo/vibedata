export interface ApiError {
  message: string
  code?: string
  fieldErrors?: Record<string, string[]>
}
