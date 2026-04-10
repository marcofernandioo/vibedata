import axios, { AxiosError } from 'axios'

import { env } from '@/config/env'
import type { ApiError } from '@/types/api-error'

export function normalizeError(error: AxiosError<ApiError>): ApiError {
  return {
    message: error.response?.data?.message ?? error.message ?? 'Something went wrong',
    code: error.response?.data?.code,
    fieldErrors: error.response?.data?.fieldErrors,
  }
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => Promise.reject(normalizeError(error)),
)
