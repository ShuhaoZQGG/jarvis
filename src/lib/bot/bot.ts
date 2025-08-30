import { DatabaseService, Bot, BotConfig, CrawlJob } from '../database/database'
import { EmbeddingsGenerator } from '../embeddings/embeddings'
import { VectorStore } from '../vectorstore/vectorstore'
import { WebScraper } from '../scraper/scraper'

export interface BotAnalytics {
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  recentConversations: any[]
}

export class BotService {
  constructor(
    private db: DatabaseService,
    private embeddings: EmbeddingsGenerator,
    private vectorStore: VectorStore,
    private scraper: WebScraper
  ) {}

  async createBot(bot: Omit<Bot, 'id' | 'created_at'>): Promise<Bot> {
    return await this.db.createBot(bot)
  }

  async getBot(botId: string): Promise<Bot | null> {
    return await this.db.getBot(botId)
  }

  async getWorkspaceBots(workspaceId: string): Promise<Bot[]> {
    return await this.db.getWorkspaceBots(workspaceId)
  }

  async updateBot(botId: string, updates: Partial<Bot>): Promise<Bot> {
    return await this.db.updateBot(botId, updates)
  }

  async deleteBot(botId: string): Promise<void> {
    // Delete all embeddings from vector store
    await this.vectorStore.deleteByNamespace(botId)
    
    // Clear embeddings from database
    await this.db.clearBotEmbeddings(botId)
    
    // Delete the bot
    await this.db.deleteBot(botId)
  }

  async trainBot(botId: string, urls: string[]): Promise<CrawlJob> {
    // Create a crawl job
    const crawlJob = await this.db.createCrawlJob(botId, urls)

    try {
      // Update status to processing
      await this.db.updateCrawlJobStatus(crawlJob.id, 'processing')

      // Scrape URLs
      let scrapedContent
      if (urls.length === 1) {
        const content = await this.scraper.scrapeUrl(urls[0])
        scrapedContent = [content]
      } else {
        scrapedContent = await this.scraper.scrapeMultipleUrls(urls)
      }

      // Process each scraped page
      for (const content of scrapedContent) {
        if (!content) continue

        // Generate embedding
        const embedding = await this.embeddings.generateEmbedding(content.content)

        // Store in vector store
        await this.vectorStore.upsertDocument(
          {
            id: `${botId}-${content.url}`,
            embedding: embedding,
            metadata: {
              botId,
              url: content.url,
              title: content.title,
              content: content.content
            }
          },
          botId // Use botId as namespace
        )

        // Store in database for backup
        await this.db.storeEmbedding(
          botId,
          content.content,
          embedding,
          {
            url: content.url,
            title: content.title
          }
        )
      }

      // Update job status to completed
      return await this.db.updateCrawlJobStatus(crawlJob.id, 'completed')
    } catch (error: any) {
      // Update job status to failed
      return await this.db.updateCrawlJobStatus(
        crawlJob.id, 
        'failed', 
        error.message || 'Training failed'
      )
    }
  }

  async retrainBot(botId: string, urls: string[]): Promise<CrawlJob> {
    // Clear existing embeddings
    await this.vectorStore.deleteByNamespace(botId)
    await this.db.clearBotEmbeddings(botId)

    // Train with new URLs
    return await this.trainBot(botId, urls)
  }

  async getBotAnalytics(botId: string): Promise<BotAnalytics> {
    const conversations = await this.db.getBotConversations(botId)
    
    let totalMessages = 0
    conversations.forEach(conv => {
      totalMessages += conv.messages.length
    })

    return {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0 
        ? totalMessages / conversations.length 
        : 0,
      recentConversations: conversations
    }
  }

  async getCrawlJobs(botId: string): Promise<CrawlJob[]> {
    return await this.db.getBotCrawlJobs(botId)
  }

  async getCrawlJobStatus(jobId: string): Promise<CrawlJob | null> {
    return await this.db.getCrawlJob(jobId)
  }
}