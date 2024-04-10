import { Session, User } from '@supabase/supabase-js'
import React, { useEffect, useState, createContext, useContext } from 'react'
import { supabase } from './lib/initSupabase'

export const UserContext = createContext<{ user: User | null; session: Session | null }>({
  user: null,
  session: null,
})

export const UserContextProvider: React.FC = (props) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: sessionData }) => {
        setSession(sessionData.session)
        setUser(sessionData.session?.user ?? null)
      })
      .catch((error) => {
        console.error('Error getting session:', error)
      })

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Supabase auth event: ${event}`)
      setSession(session)
      setUser(session?.user ?? null)
    })
    //   setUser(session?.user ?? null)
    // })

    return () => {
      // authListener?.unsubscribe()
      authListener.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = {
    session,
    user,
  }
  return <UserContext.Provider value={value} {...props} />
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserContextProvider.')
  }
  return context
}
