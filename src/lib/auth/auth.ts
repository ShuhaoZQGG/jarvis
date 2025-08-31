import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

export interface AuthResponse {
  user: User | null
  session: any
}

export class AuthService {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    // Use SSR-compatible browser client for better session management
    this.supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data as AuthResponse
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // First try to get the session
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
    
    if (sessionError || !session) {
      // No valid session, return null
      return null
    }

    // If we have a session, get the user
    const { data: { user }, error } = await this.supabase.auth.getUser()

    if (error) {
      console.error('Error getting current user:', error)
      return null
    }

    return user
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }

    return session
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  async updateProfile(updates: { name?: string; avatar_url?: string }): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.updateUser({
      data: updates
    })

    if (error) {
      throw new Error(error.message)
    }

    return user
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}