import type { User } from '@supabase/supabase-js'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user || !user.email) {
    return null
  }

  const metadata = user.user_metadata

  return {
    id: user.id,
    email: user.email,
    name:
      typeof metadata?.full_name === 'string'
        ? metadata.full_name
        : typeof metadata?.name === 'string'
          ? metadata.name
          : user.email,
    avatarUrl:
      typeof metadata?.avatar_url === 'string'
        ? metadata.avatar_url
        : typeof metadata?.picture === 'string'
          ? metadata.picture
          : null,
  }
}
