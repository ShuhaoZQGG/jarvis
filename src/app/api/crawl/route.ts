import { NextRequest, NextResponse } from 'next/server'
import { WebScraper } from '@/lib/scraper/scraper'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { v4 as uuidv4 } from 'uuid'
import { env } from '@/lib/env'
import { z } from 'zod'
import { rateLimitMiddleware, crawlRateLimiter } from '@/lib/ratelimit'

const crawlRequestSchema = z.object({
  url: z.string().url(),
  botId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(request, crawlRateLimiter)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const body = await request.json()
    
    const validationResult = crawlRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { url, botId } = validationResult.data
    const generatedBotId = botId || uuidv4()
    
    const scraper = new WebScraper()
    const embeddingsGenerator = new EmbeddingsGenerator(env.OPENAI_API_KEY)
    const vectorStore = new VectorStore({
      apiKey: env.PINECONE_API_KEY,
      indexName: env.PINECONE_INDEX_NAME,
    })

    const scrapedPage = await scraper.scrapeUrl(url)
    
    const chunks = embeddingsGenerator.chunkText(scrapedPage.content, 1000)
    
    const documents = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await embeddingsGenerator.generateEmbedding(chunk.text)
        return {
          id: `${generatedBotId}-${index}`,
          embedding,
          metadata: {
            url: scrapedPage.url,
            title: scrapedPage.title,
            content: chunk.text,
            timestamp: new Date().toISOString(),
          },
        }
      })
    )

    await vectorStore.upsertBatch(documents, generatedBotId)

    return NextResponse.json({
      success: true,
      botId: generatedBotId,
      pagesIndexed: 1,
      chunksCreated: chunks.length,
    })
  } catch (error) {
    console.error('Crawl API error:', error)
    return NextResponse.json(
      { error: 'Failed to crawl and index website' },
      { status: 500 }
    )
  }
}