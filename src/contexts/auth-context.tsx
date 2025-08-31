'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { AuthService } from '@/lib/auth/auth'
import { publicEnv } from '@/lib/public-env'

interface AuthContextType {
  user: User | null
  loading: boolean
  authService: AuthService
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authService] = useState(() => new AuthService(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ))

  useEffect(() => {
    // Check for existing session
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authService])

  const checkUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await authService.signIn(email, password)
    if (response.user) {
      setUser(response.user)
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const response = await authService.signUp(email, password, metadata)
    if (response.user) {
      setUser(response.user)
    }
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
    await checkUser()
  }

  const value = {
    user,
    loading,
    authService,
    signIn,
    signUp,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}