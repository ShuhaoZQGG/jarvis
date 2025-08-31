import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthContext } from '@/lib/auth/middleware'
import { BotService } from '@/lib/bot/bot'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { WebScraper } from '@/lib/scraper/scraper'

const UpdateBotSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.object({
    greeting: z.string().optional(),
    placeholder: z.string().optional(),
    primaryColor: z.string().optional(),
    position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
    autoOpen: z.boolean().optional(),
    openDelay: z.number().optional()
  }).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  return withAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { user, dbService } = context

      const botService = new BotService(
        dbService,
        new EmbeddingsGenerator(process.env.OPENAI_API_KEY!),
        new VectorStore({
          apiKey: process.env.PINECONE_API_KEY!,
          indexName: process.env.PINECONE_INDEX_NAME!
        }),
        new WebScraper()
      )

      const bot = await botService.getBot(params.botId)
    
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Verify user has access to this bot
    const workspace = await dbService.getWorkspace(bot.workspace_id)
    if (!workspace || workspace.owner_id !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

      return NextResponse.json({ bot })
    } catch (error) {
      console.error('Error fetching bot:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bot' },
        { status: 500 }
      )
    }
  })(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  return withAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { user, dbService } = context

    // Parse and validate request body
    const body = await request.json()
    const validationResult = UpdateBotSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const botService = new BotService(
      dbService,
      new EmbeddingsGenerator(process.env.OPENAI_API_KEY!),
      new VectorStore({
        apiKey: process.env.PINECONE_API_KEY!,
        indexName: process.env.PINECONE_INDEX_NAME!
      }),
      new WebScraper()
    )

    // Verify bot exists and user has access
    const existingBot = await botService.getBot(params.botId)
    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    const workspace = await dbService.getWorkspace(existingBot.workspace_id)
    if (!workspace || workspace.owner_id !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update bot
    const updatedBot = await botService.updateBot(params.botId, validationResult.data)
    
      return NextResponse.json({ bot: updatedBot })
    } catch (error) {
      console.error('Error updating bot:', error)
      return NextResponse.json(
        { error: 'Failed to update bot' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  return withAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { user, dbService } = context

    const botService = new BotService(
      dbService,
      new EmbeddingsGenerator(process.env.OPENAI_API_KEY!),
      new VectorStore({
        apiKey: process.env.PINECONE_API_KEY!,
        indexName: process.env.PINECONE_INDEX_NAME!
      }),
      new WebScraper()
    )

    // Verify bot exists and user has access
    const existingBot = await botService.getBot(params.botId)
    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    const workspace = await dbService.getWorkspace(existingBot.workspace_id)
    if (!workspace || workspace.owner_id !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete bot
    await botService.deleteBot(params.botId)
    
      return NextResponse.json({ message: 'Bot deleted successfully' })
    } catch (error) {
      console.error('Error deleting bot:', error)
      return NextResponse.json(
        { error: 'Failed to delete bot' },
        { status: 500 }
      )
    }
  })(request)
}