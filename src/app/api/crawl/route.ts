import { NextRequest, NextResponse } from 'next/server'
import { WebScraper } from '@/lib/scraper/scraper'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { url, botId } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const generatedBotId = botId || uuidv4()
    
    const scraper = new WebScraper()
    const embeddingsGenerator = new EmbeddingsGenerator(process.env.OPENAI_API_KEY!)
    const vectorStore = new VectorStore({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
      indexName: process.env.PINECONE_INDEX_NAME!,
    })

    const scrapedPage = await scraper.scrapeUrl(url)
    
    const chunks = embeddingsGenerator.chunkText(scrapedPage.content, 1000)
    
    const documents = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await embeddingsGenerator.generateEmbedding(chunk)
        return {
          id: `${generatedBotId}-${index}`,
          embedding,
          metadata: {
            url: scrapedPage.url,
            title: scrapedPage.title,
            content: chunk,
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