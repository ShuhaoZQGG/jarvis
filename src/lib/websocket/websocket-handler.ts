import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { VectorSearchService } from '../vector-search/vector-search'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface SocketData {
  userId?: string
  botId?: string
  sessionId?: string
  workspaceId?: string
}

export class WebSocketHandler {
  private io: SocketIOServer
  private supabase: any
  private openai: OpenAI
  private vectorSearch: VectorSearchService
  private activeSessions: Map<string, Socket> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })

    this.vectorSearch = new VectorSearchService(
      process.env.PINECONE_API_KEY!,
      process.env.PINECONE_ENVIRONMENT!,
      process.env.PINECONE_INDEX!,
      process.env.OPENAI_API_KEY!
    )

    this.setupSocketHandlers()
  }

  private setupSocketHandlers() {
    this.io.on('connection', async (socket: Socket) => {
      console.log('New WebSocket connection:', socket.id)

      // Handle authentication
      socket.on('authenticate', async (data: { token: string; botId: string }) => {
        try {
          const { data: { user }, error } = await this.supabase.auth.getUser(data.token)
          
          if (error || !user) {
            socket.emit('error', { message: 'Authentication failed' })
            socket.disconnect()
            return
          }

          // Verify bot access
          const { data: bot, error: botError } = await this.supabase
            .from('bots')
            .select('*, workspaces!inner(owner_id)')
            .eq('id', data.botId)
            .single()

          if (botError || !bot || bot.workspaces.owner_id !== user.id) {
            socket.emit('error', { message: 'Bot not found or unauthorized' })
            socket.disconnect()
            return
          }

          // Store user data in socket
          const socketData: SocketData = {
            userId: user.id,
            botId: data.botId,
            sessionId: `session_${Date.now()}`,
            workspaceId: bot.workspace_id
          }
          
          socket.data = socketData
          this.activeSessions.set(socketData.sessionId, socket)

          // Join room for this bot
          socket.join(`bot:${data.botId}`)
          
          socket.emit('authenticated', { 
            sessionId: socketData.sessionId,
            bot: {
              id: bot.id,
              name: bot.name,
              config: bot.config
            }
          })

          // Load conversation history if exists
          const { data: conversations } = await this.supabase
            .from('conversations')
            .select('*')
            .eq('bot_id', data.botId)
            .order('created_at', { ascending: false })
            .limit(1)

          if (conversations && conversations.length > 0) {
            socket.emit('history', { messages: conversations[0].messages })
          }
        } catch (error) {
          console.error('Authentication error:', error)
          socket.emit('error', { message: 'Authentication failed' })
          socket.disconnect()
        }
      })

      // Handle chat messages
      socket.on('message', async (data: { message: string }) => {
        if (!socket.data?.userId || !socket.data?.botId) {
          socket.emit('error', { message: 'Not authenticated' })
          return
        }

        const { botId, sessionId } = socket.data

        try {
          // Emit typing indicator
          socket.emit('typing', { isTyping: true })

          // Get bot configuration
          const { data: bot } = await this.supabase
            .from('bots')
            .select('*')
            .eq('id', botId)
            .single()

          if (!bot) {
            socket.emit('error', { message: 'Bot not found' })
            return
          }

          // Search for relevant context
          const searchResults = await this.vectorSearch.search(data.message, botId, 5)
          const context = searchResults.map(r => r.content).join('\n\n')

          // Build prompt
          const systemPrompt = bot.config?.systemPrompt || `You are a helpful AI assistant for ${bot.name}.`
          const contextPrompt = context 
            ? `Use the following context to answer the user's question:\n\n${context}\n\n`
            : ''

          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: contextPrompt },
            { role: 'user', content: data.message }
          ]

          // Stream OpenAI response
          const completion = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: messages as any,
            stream: true,
            temperature: 0.7,
            max_tokens: 1000
          })

          let fullResponse = ''
          
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content
              socket.emit('stream', { content })
            }
          }

          // Save conversation
          await this.saveConversation(botId, sessionId!, [
            { role: 'user', content: data.message },
            { role: 'assistant', content: fullResponse }
          ])

          // Emit completion
          socket.emit('message', { 
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
          })

          socket.emit('typing', { isTyping: false })

          // Broadcast to other connected clients for this bot
          socket.to(`bot:${botId}`).emit('message', {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString(),
            sessionId
          })

        } catch (error) {
          console.error('Message processing error:', error)
          socket.emit('error', { message: 'Failed to process message' })
          socket.emit('typing', { isTyping: false })
        }
      })

      // Handle typing indicators
      socket.on('typing', (data: { isTyping: boolean }) => {
        if (socket.data?.botId) {
          socket.to(`bot:${socket.data.botId}`).emit('userTyping', {
            sessionId: socket.data.sessionId,
            isTyping: data.isTyping
          })
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('WebSocket disconnected:', socket.id)
        if (socket.data?.sessionId) {
          this.activeSessions.delete(socket.data.sessionId)
        }
      })

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    })
  }

  private async saveConversation(
    botId: string, 
    sessionId: string, 
    messages: ChatMessage[]
  ) {
    try {
      const { data: existingConversation } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('bot_id', botId)
        .eq('session_id', sessionId)
        .single()

      if (existingConversation) {
        // Append to existing conversation
        await this.supabase
          .from('conversations')
          .update({
            messages: [...existingConversation.messages, ...messages]
          })
          .eq('id', existingConversation.id)
      } else {
        // Create new conversation
        await this.supabase
          .from('conversations')
          .insert({
            bot_id: botId,
            session_id: sessionId,
            messages
          })
      }
    } catch (error) {
      console.error('Failed to save conversation:', error)
    }
  }

  // Broadcast message to all clients in a room
  public broadcast(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data)
  }

  // Send message to specific session
  public sendToSession(sessionId: string, event: string, data: any) {
    const socket = this.activeSessions.get(sessionId)
    if (socket) {
      socket.emit(event, data)
    }
  }

  // Get active sessions count
  public getActiveSessions(): number {
    return this.activeSessions.size
  }

  // Cleanup
  public close() {
    this.io.close()
  }
}