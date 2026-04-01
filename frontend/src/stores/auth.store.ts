import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { type AuthUser, mapSupabaseUser } from '@/features/auth/types/auth.types'
import * as authApi from '@/features/auth/api/auth.api'

interface AuthState {
  session: Session | null
  user: AuthUser | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  initialize: () => Promise<void>
  logout: () => Promise<void>
}

function syncSession(session: Session | null, set: (partial: Partial<AuthState>) => void) {
  set({
    session,
    user: mapSupabaseUser(session?.user ?? null),
    isLoading: false,
  })
}

// Module-level flag to ensure the Supabase onAuthStateChange listener is
// registered only once, even if initialize() is called multiple times
// (e.g. React StrictMode double-mount in development).
let authListenerRegistered = false

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        session: null,
        user: null,
        isLoading: true,
        setSession: (session) => {
          syncSession(session, set)
        },
        initialize: async () => {
          if (!authListenerRegistered) {
            supabase.auth.onAuthStateChange((_event, session) => {
              syncSession(session, set)
            })
            authListenerRegistered = true
          }

          const session = await authApi.getSession()
          syncSession(session, set)
        },
        logout: async () => {
          await authApi.signOut()
          syncSession(null, set)
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          session: state.session,
          user: state.user,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
)
