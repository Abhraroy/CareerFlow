import { supabase } from './client'
import { UserRow, UserInsert, UserUpdate } from './database.types'
import Logger from '@utils/logger'

export async function getUserProfile(userId: string): Promise<UserRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()

  if (error) {
    Logger.error('users.ts', 'getUserProfile', 'Error fetching user profile from public.users', error)
    throw error
  }

  return data
}

export async function updateUserProfile(
  userId: string,
  updates: UserUpdate
): Promise<UserRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    Logger.error('users.ts', 'updateUserProfile', 'Error updating user profile in public.users', error)
    throw error
  }

  return data
}

export async function updateUserFullName(
  userId: string,
  fullName: string
): Promise<UserRow | null> {
  if (!supabase) return null

  const trimmedName = fullName.trim()
  const updatedUser = await updateUserProfile(userId, {
    name: trimmedName,
    updated_at: new Date().toISOString()
  })

  // Synchronize with auth user metadata
  try {
    await supabase.auth.updateUser({
      data: {
        name: trimmedName,
        full_name: trimmedName
      }
    })
  } catch (authErr) {
    Logger.warn('users.ts', 'updateUserFullName', 'Could not sync auth user metadata during name update', authErr)
  }

  return updatedUser
}

export async function upsertUserProfile(user: UserInsert): Promise<UserRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    Logger.error('users.ts', 'upsertUserProfile', 'Error upserting user profile in public.users', error)
    throw error
  }

  return data
}

export async function ensureUserProfile(user: {
  id: string
  email?: string | null
  name?: string | null
}): Promise<UserRow | null> {
  if (!supabase) return null

  const existing = await getUserProfile(user.id)
  if (existing) {
    return existing
  }

  const defaultName = user.name || (user.email ? user.email.split('@')[0] : 'User')
  return upsertUserProfile({
    id: user.id,
    email: user.email ?? null,
    name: defaultName
  })
}
