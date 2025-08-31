import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Re-export Database type for backwards compatibility
export type { Database } from '@/types/database.types'

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