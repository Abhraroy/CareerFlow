import { supabase } from './client'
import { AuthChangeEvent, AuthResponse, Session, Subscription, User } from '@supabase/supabase-js'
import { ensureUserProfile } from './users'
import Logger from '@utils/logger'

export interface SignUpParams {
  email: string
  password: string
  name: string
}

export interface SignInParams {
  email: string
  password: string
}

export interface ResetPasswordParams {
  email: string
  redirectTo?: string
}

/**
 * Sign up a new user with email, password, and full name.
 * Passes the name to raw_user_meta_data so it automatically propagates
 * to public.users via Supabase triggers and client synchronization.
 */
export async function signUp({
  email,
  password,
  name
}: SignUpParams): Promise<AuthResponse['data']> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const trimmedEmail = email.trim()
  const trimmedName = name.trim()

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: {
        name: trimmedName,
        full_name: trimmedName
      }
    }
  })

  if (error) {
    throw error
  }

  // If a session was immediately created (e.g. email confirmation disabled), ensure public.users profile exists
  if (data.user) {
    try {
      await ensureUserProfile({
        id: data.user.id,
        email: data.user.email,
        name: trimmedName
      })
    } catch (profileError) {
      Logger.warn('auth.ts', 'signUp', 'Could not immediately sync public.users record', profileError)
    }
  }

  return data
}

/**
 * Sign in existing user with email and password.
 */
export async function signIn({ email, password }: SignInParams): Promise<AuthResponse['data']> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  })

  if (error) {
    throw error
  }

  if (data.user) {
    try {
      const displayName =
        data.user.user_metadata?.name ||
        data.user.user_metadata?.full_name ||
        (data.user.email ? data.user.email.split('@')[0] : 'User')

      await ensureUserProfile({
        id: data.user.id,
        email: data.user.email,
        name: displayName
      })
    } catch (profileError) {
      Logger.warn('auth.ts', 'signIn', 'Could not sync public.users record on sign in', profileError)
    }
  }

  return data
}

/**
 * Sign out current authenticated user.
 */
export async function signOut(): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

/**
 * Send password reset email.
 */
export async function resetPassword({ email, redirectTo }: ResetPasswordParams): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo
  })

  if (error) {
    throw error
  }
}

/**
 * Update password for the currently signed-in user.
 */
export async function updatePassword(newPassword: string): Promise<User | null> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    throw error
  }

  return data.user
}

export interface ChangePasswordParams {
  currentPassword?: string
  newPassword: string
  email?: string
}

/**
 * Changes password by verifying current password first (if provided)
 * and updating to the new password.
 */
export async function changePassword({
  currentPassword,
  newPassword,
  email
}: ChangePasswordParams): Promise<User | null> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  if (currentPassword && email) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: currentPassword
    })
    if (verifyError) {
      throw new Error('Current password is incorrect.')
    }
  }

  return updatePassword(newPassword)
}

/**
 * Get the current active session.
 */
export async function getSession(): Promise<Session | null> {
  if (!supabase) return null

  const { data, error } = await supabase.auth.getSession()
  if (error) {
    Logger.error('auth.ts', 'getSession', 'Error retrieving session', error)
    return null
  }

  return data.session
}



/**
 * Subscribe to Supabase Auth state changes.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { subscription: Subscription } | null {
  if (!supabase) return null

  const { data } = supabase.auth.onAuthStateChange(callback)
  return data
}
