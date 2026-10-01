import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth(): { status: AuthStatus; session: Session | null } {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'unauthenticated')
    }).catch(() => {
      if (!mounted) return
      setSession(null)
      setStatus('unauthenticated')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setStatus(newSession ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { status, session }
}
