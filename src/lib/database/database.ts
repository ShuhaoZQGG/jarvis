import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { createHash } from 'crypto'

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface Bot {
  id: string
  workspace_id: string
  name: string
  config: BotConfig
  created_at: string
}

export interface BotConfig {
  greeting?: string
  placeholder?: string
  primaryColor?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  autoOpen?: boolean
  openDelay?: number
}

export interface Conversation {
  id: string
  bot_id: string
  session_id: string
  messages: Message[]
  created_at: string
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface CrawlJob {
  id: string
  bot_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  urls: string[]
  created_at: string
  completed_at?: string
  error?: string
}

export interface ApiKey {
  id: string
  workspace_id: string
  key_hash: string
  created_at: string
}

export class DatabaseService {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // Workspace Management
  async createWorkspace(name: string, ownerId: string): Promise<Workspace> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .insert({ name, owner_id: ownerId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId)

    if (error) throw new Error(error.message)
    return data || []
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data
  }

  // Bot Management
  async createBot(bot: Omit<Bot, 'id' | 'created_at'>): Promise<Bot> {
    const { data, error } = await this.supabase
      .from('bots')
      .insert(bot)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async getBot(botId: string): Promise<Bot | null> {
    const { data, error } = await this.supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data
  }

  async getWorkspaceBots(workspaceId: string): Promise<Bot[]> {
    const { data, error } = await this.supabase
      .from('bots')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) throw new Error(error.message)
    return data || []
  }

  async updateBot(botId: string, updates: Partial<Bot>): Promise<Bot> {
    const { data, error } = await this.supabase
      .from('bots')
      .update(updates)
      .eq('id', botId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async deleteBot(botId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bots')
      .delete()
      .eq('id', botId)

    if (error) throw new Error(error.message)
  }

  // Conversation Management
  async createConversation(botId: string, sessionId: string): Promise<Conversation> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        bot_id: botId,
        session_id: sessionId,
        messages: []
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data
  }

  async getConversationBySession(botId: string, sessionId: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('bot_id', botId)
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data
  }

  async addMessageToConversation(conversationId: string, message: Message): Promise<Conversation> {
    // First get the current conversation
    const { data: conversation, error: fetchError } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    // Add timestamp to message if not present
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    }

    // Update with new message
    const updatedMessages = [...(conversation.messages || []), messageWithTimestamp]
    
    const { data, error } = await this.supabase
      .from('conversations')
      .update({ messages: updatedMessages })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async getBotConversations(botId: string, limit = 50): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return data || []
  }

  // Crawl Jobs
  async createCrawlJob(botId: string, urls: string[]): Promise<CrawlJob> {
    const { data, error } = await this.supabase
      .from('crawl_jobs')
      .insert({
        bot_id: botId,
        status: 'pending',
        urls
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async getCrawlJob(jobId: string): Promise<CrawlJob | null> {
    const { data, error } = await this.supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data
  }

  async updateCrawlJobStatus(
    jobId: string, 
    status: CrawlJob['status'], 
    error?: string
  ): Promise<CrawlJob> {
    const updates: any = { status }
    
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }
    
    if (error) {
      updates.error = error
    }

    const { data, error: updateError } = await this.supabase
      .from('crawl_jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) throw new Error(updateError.message)
    return data
  }

  async getBotCrawlJobs(botId: string): Promise<CrawlJob[]> {
    const { data, error } = await this.supabase
      .from('crawl_jobs')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }

  // API Keys
  async createApiKey(workspaceId: string): Promise<{ key: string; keyHash: string }> {
    const key = `jrv_${randomBytes(32).toString('hex')}`
    const keyHash = createHash('sha256').update(key).digest('hex')

    const { error } = await this.supabase
      .from('api_keys')
      .insert({
        workspace_id: workspaceId,
        key_hash: keyHash
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    
    return { key, keyHash }
  }

  async validateApiKey(keyHash: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('id')
      .eq('key_hash', keyHash)

    if (error) throw new Error(error.message)
    return data && data.length > 0
  }

  async getWorkspaceApiKeys(workspaceId: string): Promise<ApiKey[]> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) throw new Error(error.message)
    return data || []
  }

  async revokeApiKey(keyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)

    if (error) throw new Error(error.message)
  }

  // Embeddings
  async storeEmbedding(
    botId: string, 
    content: string, 
    vector: number[], 
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('embeddings')
      .insert({
        bot_id: botId,
        content,
        vector,
        metadata: metadata || {}
      })

    if (error) throw new Error(error.message)
  }

  async clearBotEmbeddings(botId: string): Promise<void> {
    const { error } = await this.supabase
      .from('embeddings')
      .delete()
      .eq('bot_id', botId)

    if (error) throw new Error(error.message)
  }
}