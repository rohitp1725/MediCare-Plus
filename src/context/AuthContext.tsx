import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, RoleType } from '@/types'

interface SignUpInput {
  fullName: string
  email: string
  password: string
  role: RoleType
  phone?: string
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  dbReady: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, phone, avatar_emoji')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      fullName: data.full_name,
      role: data.role,
      phone: data.phone,
      avatarEmoji: data.avatar_emoji ?? '👤',
    }
  } catch {
    return null
  }
}

/** Check if the profiles table exists — indicates migrations have been run */
async function checkDbReady(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    // If error code is 42P01 (undefined_table), db is not ready
    if (error && (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/** Attempt to create profile for user after signup — handles race with DB trigger */
async function ensureProfile(userId: string, meta: { full_name: string; role: string; phone?: string | null }): Promise<Profile | null> {
  // First try to fetch existing
  let profile = await fetchProfile(userId)
  if (profile) return profile

  // Try to insert manually (in case trigger didn't run)
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: meta.full_name,
      role: meta.role as RoleType,
      phone: meta.phone || null,
      avatar_emoji: '👤',
    }, { onConflict: 'id', ignoreDuplicates: false })
  } catch { /* ignore */ }

  // Then create role-specific record
  if (meta.role === 'patient') {
    try { await supabase.from('patients').upsert({ profile_id: userId }, { onConflict: 'profile_id', ignoreDuplicates: true }) } catch { /* ignore */ }
  } else if (meta.role === 'caregiver') {
    try { await supabase.from('caregivers').upsert({ profile_id: userId }, { onConflict: 'profile_id', ignoreDuplicates: true }) } catch { /* ignore */ }
  } else if (meta.role === 'doctor') {
    try { await supabase.from('doctors').upsert({ profile_id: userId }, { onConflict: 'profile_id', ignoreDuplicates: true }) } catch { /* ignore */ }
  }

  // Retry fetch
  await new Promise(r => setTimeout(r, 500))
  profile = await fetchProfile(userId)
  return profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbReady, setDbReady] = useState(true)
  const profileTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let active = true

    async function init() {
      // Check if database is set up
      const ready = await checkDbReady()
      if (active) setDbReady(ready)

      const { data } = await supabase.auth.getSession()
      if (!active) return

      setSession(data.session)

      if (data.session?.user && ready) {
        const p = await fetchProfile(data.session.user.id)
        if (active) setProfile(p)
      }

      if (active) setLoading(false)
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return
      setSession(newSession)

      if (newSession?.user) {
        const p = await fetchProfile(newSession.user.id)
        if (active) setProfile(p)

        // If profile is still null after 3s, try to create it
        if (!p) {
          profileTimeout.current = setTimeout(async () => {
            const meta = newSession.user.user_metadata
            const created = await ensureProfile(newSession.user.id, {
              full_name: meta?.full_name ?? 'User',
              role: meta?.role ?? 'patient',
              phone: meta?.phone,
            })
            if (active && created) setProfile(created)
          }, 2000)
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      if (profileTimeout.current) clearTimeout(profileTimeout.current)
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function signUp({ fullName, email, password, role, phone }: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, phone: phone || null },
      },
    })

    if (error) return { error: error.message }

    // If auto-confirmed (no email confirmation needed), try to create profile immediately
    if (data.session && data.user) {
      const created = await ensureProfile(data.user.id, { full_name: fullName, role, phone })
      if (created) setProfile(created)
    }

    return {
      error: null,
      needsEmailConfirmation: !data.session,
    }
  }

  async function signOut() {
    setProfile(null)
    await supabase.auth.signOut()
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error ? error.message : null }
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error ? error.message : null }
  }

  async function refreshProfile() {
    if (!session?.user) return
    const p = await fetchProfile(session.user.id)
    setProfile(p)
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    dbReady,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
