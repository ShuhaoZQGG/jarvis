import { createClient } from '@supabase/supabase-js'

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          metadata: Record<string, any>
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }
      bots: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          url: string | null
          status: 'draft' | 'training' | 'ready' | 'error'
          settings: {
            theme: string
            position: string
            greeting: string
            placeholder: string
            primaryColor: string
          }
          training_data: any[]
          created_at: string
          updated_at: string
          last_trained_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['bots']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bots']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          bot_id: string
          session_id: string
          user_email: string | null
          user_name: string | null
          metadata: Record<string, any>
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Record<string, any>
          tokens_used: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper functions for common operations
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

export async function getUserWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*, workspace_members!inner(*)')
    .or(`owner_id.eq.${userId},workspace_members.user_id.eq.${userId}`)
  
  return { data, error }
}

export async function createWorkspace(name: string, ownerId: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name,
      slug,
      owner_id: ownerId,
      plan: 'free',
      settings: {}
    })
    .select()
    .single()
  
  if (data && !error) {
    // Add owner as workspace member
    await supabase
      .from('workspace_members')
      .insert({
        workspace_id: data.id,
        user_id: ownerId,
        role: 'owner'
      })
  }
  
  return { data, error }
}

export async function getWorkspaceBots(workspaceId: string) {
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createBot(workspaceId: string, name: string, description?: string) {
  const { data, error } = await supabase
    .from('bots')
    .insert({
      workspace_id: workspaceId,
      name,
      description,
      status: 'draft',
      settings: {
        theme: 'light',
        position: 'bottom-right',
        greeting: 'Hi! How can I help you today?',
        placeholder: 'Type your message...',
        primaryColor: '#0066FF'
      },
      training_data: []
    })
    .select()
    .single()
  
  return { data, error }
}

export async function getBotConversations(botId: string, limit = 50) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(count)')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return { data, error }
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  
  return { data, error }
}