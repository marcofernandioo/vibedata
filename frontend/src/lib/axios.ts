import axios, { AxiosError } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth.store'

export interface ApiError {
  message: string
  code?: string
  fieldErrors?: Record<string, string[]>
}

export function normalizeError(error: AxiosError<ApiError>): ApiError {
  return {
    message: error.response?.data?.message ?? error.message ?? 'Something went wrong',
    code: error.response?.data?.code,
    fieldErrors: error.response?.data?.fieldErrors,
  }
}

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

apiClient.interceptors.request.use(async (config) => {
  const accessToken = useAuthStore.getState().session?.access_token

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout()
    }

    return Promise.reject(normalizeError(error))
  },
)
