import 'openai/shims/node'
import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/chat/chat'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'
import { env } from '@/lib/env'
import { z } from 'zod'
import { rateLimitMiddleware, chatRateLimiter } from '@/lib/ratelimit'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const chatRequestSchema = z.object({
  message: z.string().min(1),
  botId: z.string().min(1),
  sessionId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimitMiddleware(request, chatRateLimiter)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const body = await request.json()
    
    const validationResult = chatRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { message, botId, history, sessionId = uuidv4() } = validationResult.data

    // Verify bot exists
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, name, workspace_id')
      .eq('id', botId)
      .single()

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    // Get or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('bot_id', botId)
      .eq('session_id', sessionId)
      .single()

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          bot_id: botId,
          session_id: sessionId,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError || !newConv) {
        console.error('Failed to create conversation:', createError)
      } else {
        conversation = newConv
      }
    }

    // Save user message
    if (conversation) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: message
        })
    }

    const vectorStore = new VectorStore({
      apiKey: env.PINECONE_API_KEY,
      indexName: env.PINECONE_INDEX_NAME,
    })

    const embeddingsGenerator = new EmbeddingsGenerator(env.OPENAI_API_KEY)

    const chatService = new ChatService({
      openaiApiKey: env.OPENAI_API_KEY,
      vectorStore,
      embeddingsGenerator,
    })

    const response = await chatService.chat(message, botId, { history })

    // Save bot response
    if (conversation) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: response.answer
        })
    }

    return NextResponse.json({
      message: response.answer,
      sources: response.sources,
      sessionId
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}