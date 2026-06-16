'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, setAccessToken } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function syncUser(session: Session | null) {
      if (!mounted) return
      setUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
      if (session?.user) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          if (!mounted) return
          if (!profileData) {
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({ id: session.user.id, email: session.user.email ?? session.user.id })
            if (!mounted) return
            if (!upsertError) {
              const { data: created } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()
              if (mounted) setProfile(created)
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (mounted) setProfile({ id: session.user.id, email: session.user.email ?? '' } as any)
            }
          } else {
            if (mounted) setProfile(profileData)
          }
        } catch {
          if (mounted) setProfile(null)
        }
      } else {
        setProfile(null)
      }
      if (mounted) setLoading(false)
    }

    // Safety net: if INITIAL_SESSION never fires (e.g. Supabase hangs),
    // unblock the UI after 8 seconds so users see zeroes instead of
    // an infinite skeleton.
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 8000)

    // onAuthStateChange fires INITIAL_SESSION on subscription, which is the
    // correct hook for bootstrapping session state. We no longer call
    // getSession() separately to avoid a race where getSession() blocks on
    // the auth lock while the client is mid-refresh, causing an indefinite hang.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        clearTimeout(timeout)
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setAccessToken(null)
          setLoading(false)
          window.location.assign('/login')
          return
        }
        await syncUser(session)
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading, setAccessToken])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delay={200}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
