import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = `${window.location.origin}/auth/callback`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error) {
    throw error
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data.session
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data.session
}

/**
 * Completes the Supabase OAuth PKCE flow after the provider redirects back.
 * If a `code` query param is present, exchanges it for a session.
 * Otherwise falls back to retrieving the existing session (e.g. implicit flow).
 */
export async function completeOAuthCallback(): Promise<Session | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')

  if (!code) {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return data.session
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    throw error
  }

  return data.session
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}
