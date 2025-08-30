import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BotService } from '@/lib/bot/bot'
import { DatabaseService } from '@/lib/database/database'
import { AuthService } from '@/lib/auth/auth'
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

export async function GET(request: NextRequest) {
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

    // Get user's workspace
    const dbService = new DatabaseService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    const workspaces = await dbService.getUserWorkspaces(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ bots: [] })
    }

    // Get bots for the first workspace (in production, handle multiple workspaces)
    const workspaceId = request.nextUrl.searchParams.get('workspace_id') || workspaces[0].id
    
    const botService = new BotService(
      dbService,
      new EmbeddingsGenerator(process.env.OPENAI_API_KEY!),
      new VectorStore({
        apiKey: process.env.PINECONE_API_KEY!,
        indexName: process.env.PINECONE_INDEX_NAME!
      }),
      new WebScraper()
    )

    const bots = await botService.getWorkspaceBots(workspaceId)
    
    return NextResponse.json({ bots })
  } catch (error) {
    console.error('Error fetching bots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bots' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const validationResult = CreateBotSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, config } = validationResult.data

    // Get user's workspace
    const dbService = new DatabaseService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    const workspaces = await dbService.getUserWorkspaces(user.id)
    if (workspaces.length === 0) {
      // Create a default workspace if none exists
      const workspace = await dbService.createWorkspace('Default Workspace', user.id)
      workspaces.push(workspace)
    }

    const workspaceId = body.workspace_id || workspaces[0].id

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
      workspace_id: workspaceId,
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
}