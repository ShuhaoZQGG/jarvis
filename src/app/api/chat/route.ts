import 'openai/shims/node'
import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/chat/chat'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'
import { env } from '@/lib/env'
import { z } from 'zod'
import { rateLimitMiddleware, chatRateLimiter } from '@/lib/ratelimit'

const chatRequestSchema = z.object({
  message: z.string().min(1),
  botId: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(request, chatRateLimiter)
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

    const { message, botId, history } = validationResult.data

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

    return NextResponse.json(response)
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