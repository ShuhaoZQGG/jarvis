import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface AnalyticsEvent {
  event_type: 'widget_loaded' | 'chat_started' | 'message_sent' | 'message_received' | 'error'
  bot_id?: string
  workspace_id?: string
  session_id?: string
  metadata?: Record<string, any>
  timestamp?: string
}

export class AnalyticsService {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Track an analytics event
   */
  async track(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert({
          ...event,
          timestamp: event.timestamp || new Date().toISOString()
        })

      if (error) {
        console.error('Failed to track analytics event:', error)
      }
    } catch (error) {
      // Fail silently for analytics
      console.error('Analytics tracking error:', error)
    }
  }

  /**
   * Track widget load event
   */
  async trackWidgetLoad(botId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({
      event_type: 'widget_loaded',
      bot_id: botId,
      metadata: {
        ...metadata,
        user_agent: metadata?.user_agent || 'unknown',
        referrer: metadata?.referrer || 'direct'
      }
    })
  }

  /**
   * Track chat interaction
   */
  async trackChatInteraction(
    botId: string,
    sessionId: string,
    eventType: 'chat_started' | 'message_sent' | 'message_received',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.track({
      event_type: eventType,
      bot_id: botId,
      session_id: sessionId,
      metadata
    })
  }

  /**
   * Get analytics summary for a bot
   */
  async getBotAnalytics(
    botId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total_loads: number
    unique_sessions: number
    total_messages: number
    avg_messages_per_session: number
  }> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate || new Date()

    // Get widget loads
    const { data: loads } = await this.supabase
      .from('analytics_events')
      .select('id')
      .eq('bot_id', botId)
      .eq('event_type', 'widget_loaded')
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())

    // Get unique sessions
    const { data: sessions } = await this.supabase
      .from('analytics_events')
      .select('session_id')
      .eq('bot_id', botId)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())

    const uniqueSessions = new Set(sessions?.map(s => s.session_id)).size

    // Get message counts
    const { data: messages } = await this.supabase
      .from('analytics_events')
      .select('id')
      .eq('bot_id', botId)
      .in('event_type', ['message_sent', 'message_received'])
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())

    const totalMessages = messages?.length || 0
    const avgMessages = uniqueSessions > 0 ? totalMessages / uniqueSessions : 0

    return {
      total_loads: loads?.length || 0,
      unique_sessions: uniqueSessions,
      total_messages: totalMessages,
      avg_messages_per_session: Math.round(avgMessages * 10) / 10
    }
  }

  /**
   * Get workspace usage metrics
   */
  async getWorkspaceUsage(
    workspaceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total_messages: number
    active_bots: number
    total_sessions: number
  }> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()

    const { data } = await this.supabase
      .from('analytics_events')
      .select('bot_id, session_id, event_type')
      .eq('workspace_id', workspaceId)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())

    const uniqueBots = new Set(data?.map(d => d.bot_id)).size
    const uniqueSessions = new Set(data?.map(d => d.session_id)).size
    const totalMessages = data?.filter(d => 
      d.event_type === 'message_sent' || d.event_type === 'message_received'
    ).length || 0

    return {
      total_messages: totalMessages,
      active_bots: uniqueBots,
      total_sessions: uniqueSessions
    }
  }
}