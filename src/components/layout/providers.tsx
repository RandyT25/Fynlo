'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          if (!profileData) {
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({ id: session.user.id, email: session.user.email ?? session.user.id })
            if (!upsertError) {
              const { data: created } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()
              setProfile(created)
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setProfile({ id: session.user.id, email: session.user.email ?? '' } as any)
            }
          } else {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
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
