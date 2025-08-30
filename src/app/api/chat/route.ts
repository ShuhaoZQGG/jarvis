import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/chat/chat'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'

export async function POST(request: NextRequest) {
  try {
    const { message, botId, history } = await request.json()

    if (!message || !botId) {
      return NextResponse.json(
        { error: 'Message and botId are required' },
        { status: 400 }
      )
    }

    const vectorStore = new VectorStore({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
      indexName: process.env.PINECONE_INDEX_NAME!,
    })

    const embeddingsGenerator = new EmbeddingsGenerator(process.env.OPENAI_API_KEY!)

    const chatService = new ChatService({
      openaiApiKey: process.env.OPENAI_API_KEY!,
      vectorStore,
      embeddingsGenerator,
    })

    const response = await chatService.chat(message, botId, { history })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}