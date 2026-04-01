const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
} as const

for (const [key, value] of Object.entries(env)) {
  if (!value) {
    throw new Error(`Missing environment variable: VITE_${key}`)
  }
}

export { env }
