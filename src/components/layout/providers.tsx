'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'
import type { Session } from '@supabase/supabase-js'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function syncUser(session: Session | null) {
      if (!mounted) return
      setUser(session?.user ?? null)
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

    // Bootstrap from the current session directly — this triggers a client-side
    // token refresh if the access token is expired, bypassing the race condition
    // where the middleware's server-side refresh invalidates the browser's refresh
    // token before the new tokens reach the browser in the response cookies.
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session)
    }).catch(() => {
      if (mounted) { setUser(null); setProfile(null); setLoading(false) }
    })

    // Handle subsequent auth events (login, logout, background token refresh).
    // INITIAL_SESSION is skipped — we handle the initial state via getSession() above.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return
        await syncUser(session)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading])

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
