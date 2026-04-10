const DEFAULT_API_BASE_URL = 'http://localhost:3000'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
  /\/$/,
  '',
)

export const env = {
  apiBaseUrl,
  appName: import.meta.env.VITE_APP_NAME ?? 'VibeData',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

if (!env.apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set')
}
