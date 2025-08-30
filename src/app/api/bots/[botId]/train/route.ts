import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BotService } from '@/lib/bot/bot'
import { DatabaseService } from '@/lib/database/database'
import { AuthService } from '@/lib/auth/auth'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { WebScraper } from '@/lib/scraper/scraper'

const TrainBotSchema = z.object({
  urls: z.array(z.string().url()).min(1, 'At least one URL is required'),
  retrain: z.boolean().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    // Authenticate user
    const authService = new AuthService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = TrainBotSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { urls, retrain } = validationResult.data

    const dbService = new DatabaseService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

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
    const bot = await botService.getBot(params.botId)
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    const workspace = await dbService.getWorkspace(bot.workspace_id)
    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Train or retrain the bot
    const crawlJob = retrain 
      ? await botService.retrainBot(params.botId, urls)
      : await botService.trainBot(params.botId, urls)
    
    return NextResponse.json({ 
      message: retrain ? 'Bot retraining started' : 'Bot training started',
      jobId: crawlJob.id,
      status: crawlJob.status
    }, { status: 202 })
  } catch (error) {
    console.error('Error training bot:', error)
    return NextResponse.json(
      { error: 'Failed to start bot training' },
      { status: 500 }
    )
  }
}

// Get training status
export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    // Authenticate user
    const authService = new AuthService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbService = new DatabaseService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

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
    const bot = await botService.getBot(params.botId)
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    const workspace = await dbService.getWorkspace(bot.workspace_id)
    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get crawl jobs for this bot
    const crawlJobs = await botService.getCrawlJobs(params.botId)
    
    return NextResponse.json({ 
      jobs: crawlJobs
    })
  } catch (error) {
    console.error('Error fetching training status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training status' },
      { status: 500 }
    )
  }
}