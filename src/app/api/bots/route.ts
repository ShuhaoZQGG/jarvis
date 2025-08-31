import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthContext } from '@/lib/auth/middleware'
import { BotService } from '@/lib/bot/bot'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { WebScraper } from '@/lib/scraper/scraper'

const CreateBotSchema = z.object({
  name: z.string().min(1, 'Bot name is required'),
  config: z.object({
    greeting: z.string().optional(),
    placeholder: z.string().optional(),
    primaryColor: z.string().optional(),
    position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
    autoOpen: z.boolean().optional(),
    openDelay: z.number().optional()
  }).optional()
})

export const GET = withAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { workspace, dbService } = context
    
    const botService = new BotService(
      dbService,
      new EmbeddingsGenerator(process.env.OPENAI_API_KEY!),
      new VectorStore({
        apiKey: process.env.PINECONE_API_KEY!,
        indexName: process.env.PINECONE_INDEX_NAME!
      }),
      new WebScraper()
    )

    const bots = await botService.getWorkspaceBots(workspace.id)
    
    return NextResponse.json({ bots })
  } catch (error) {
    console.error('Error fetching bots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bots' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { workspace, dbService } = context
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateBotSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, config } = validationResult.data

    // Create bot
    const botService = new BotService(
      dbService,
      new EmbeddingsGenerator(process.env.OPENAI_API_KEY!),
      new VectorStore({
        apiKey: process.env.PINECONE_API_KEY!,
        indexName: process.env.PINECONE_INDEX_NAME!
      }),
      new WebScraper()
    )

    const bot = await botService.createBot({
      workspace_id: workspace.id,
      name,
      config: config || {}
    })
    
    return NextResponse.json({ bot }, { status: 201 })
  } catch (error) {
    console.error('Error creating bot:', error)
    return NextResponse.json(
      { error: 'Failed to create bot' },
      { status: 500 }
    )
  }
})