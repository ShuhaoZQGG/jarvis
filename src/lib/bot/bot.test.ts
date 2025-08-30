import { BotService } from './bot'
import { DatabaseService } from '../database/database'
import { EmbeddingsGenerator } from '../embeddings/embeddings'
import { VectorStore } from '../vectorstore/vectorstore'
import { WebScraper } from '../scraper/scraper'

jest.mock('../database/database')
jest.mock('../embeddings/embeddings')
jest.mock('../vectorstore/vectorstore')
jest.mock('../scraper/scraper')

describe('BotService', () => {
  let botService: BotService
  let mockDb: jest.Mocked<DatabaseService>
  let mockEmbeddings: jest.Mocked<EmbeddingsGenerator>
  let mockVectorStore: jest.Mocked<VectorStore>
  let mockScraper: jest.Mocked<WebScraper>

  beforeEach(() => {
    mockDb = new DatabaseService('', '') as jest.Mocked<DatabaseService>
    mockEmbeddings = new EmbeddingsGenerator('') as jest.Mocked<EmbeddingsGenerator>
    mockVectorStore = new VectorStore('', '') as jest.Mocked<VectorStore>
    mockScraper = new WebScraper() as jest.Mocked<WebScraper>

    botService = new BotService(mockDb, mockEmbeddings, mockVectorStore, mockScraper)
  })

  describe('Bot Creation', () => {
    it('should create a new bot', async () => {
      const mockBot = {
        id: 'bot-1',
        workspace_id: 'workspace-1',
        name: 'Test Bot',
        config: {
          greeting: 'Hello!',
          primaryColor: '#6366F1'
        },
        created_at: new Date().toISOString()
      }

      mockDb.createBot.mockResolvedValue(mockBot)

      const result = await botService.createBot({
        workspace_id: 'workspace-1',
        name: 'Test Bot',
        config: {
          greeting: 'Hello!',
          primaryColor: '#6366F1'
        }
      })

      expect(result).toEqual(mockBot)
      expect(mockDb.createBot).toHaveBeenCalledWith({
        workspace_id: 'workspace-1',
        name: 'Test Bot',
        config: {
          greeting: 'Hello!',
          primaryColor: '#6366F1'
        }
      })
    })
  })

  describe('Bot Training', () => {
    it('should train a bot with a single URL', async () => {
      const botId = 'bot-1'
      const url = 'https://example.com'
      const mockContent = {
        url,
        title: 'Example',
        content: 'This is example content',
        metadata: {}
      }
      const mockEmbedding = [0.1, 0.2, 0.3]
      const mockJob = {
        id: 'job-1',
        bot_id: botId,
        status: 'pending' as const,
        urls: [url],
        created_at: new Date().toISOString()
      }

      mockDb.createCrawlJob.mockResolvedValue(mockJob)
      mockScraper.scrapeUrl.mockResolvedValue(mockContent)
      mockEmbeddings.generateEmbedding.mockResolvedValue(mockEmbedding)
      mockVectorStore.upsertDocument.mockResolvedValue(undefined)
      mockDb.storeEmbedding.mockResolvedValue(undefined)
      mockDb.updateCrawlJobStatus.mockResolvedValue({
        ...mockJob,
        status: 'completed'
      })

      const result = await botService.trainBot(botId, [url])

      expect(result.status).toBe('completed')
      expect(mockScraper.scrapeUrl).toHaveBeenCalledWith(url)
      expect(mockEmbeddings.generateEmbedding).toHaveBeenCalledWith(mockContent.content)
      expect(mockVectorStore.upsertDocument).toHaveBeenCalled()
      expect(mockDb.storeEmbedding).toHaveBeenCalledWith(
        botId,
        mockContent.content,
        mockEmbedding,
        expect.objectContaining({ url, title: 'Example' })
      )
    })

    it('should handle training errors gracefully', async () => {
      const botId = 'bot-1'
      const url = 'https://example.com'
      const mockJob = {
        id: 'job-1',
        bot_id: botId,
        status: 'pending' as const,
        urls: [url],
        created_at: new Date().toISOString()
      }

      mockDb.createCrawlJob.mockResolvedValue(mockJob)
      mockScraper.scrapeUrl.mockRejectedValue(new Error('Scraping failed'))
      mockDb.updateCrawlJobStatus.mockResolvedValue({
        ...mockJob,
        status: 'failed',
        error: 'Scraping failed'
      })

      const result = await botService.trainBot(botId, [url])

      expect(result.status).toBe('failed')
      expect(result.error).toBe('Scraping failed')
    })

    it('should train bot with multiple URLs', async () => {
      const botId = 'bot-1'
      const urls = ['https://example.com/1', 'https://example.com/2']
      const mockJob = {
        id: 'job-1',
        bot_id: botId,
        status: 'pending' as const,
        urls,
        created_at: new Date().toISOString()
      }

      mockDb.createCrawlJob.mockResolvedValue(mockJob)
      mockScraper.scrapeMultipleUrls.mockResolvedValue([
        { url: urls[0], title: 'Page 1', content: 'Content 1', metadata: {} },
        { url: urls[1], title: 'Page 2', content: 'Content 2', metadata: {} }
      ])
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3])
      mockVectorStore.upsertDocument.mockResolvedValue(undefined)
      mockDb.storeEmbedding.mockResolvedValue(undefined)
      mockDb.updateCrawlJobStatus.mockResolvedValue({
        ...mockJob,
        status: 'completed'
      })

      const result = await botService.trainBot(botId, urls)

      expect(result.status).toBe('completed')
      expect(mockScraper.scrapeMultipleUrls).toHaveBeenCalledWith(urls)
      expect(mockEmbeddings.generateEmbedding).toHaveBeenCalledTimes(2)
    })
  })

  describe('Bot Retrieval', () => {
    it('should get bot by id', async () => {
      const mockBot = {
        id: 'bot-1',
        workspace_id: 'workspace-1',
        name: 'Test Bot',
        config: {},
        created_at: new Date().toISOString()
      }

      mockDb.getBot.mockResolvedValue(mockBot)

      const result = await botService.getBot('bot-1')

      expect(result).toEqual(mockBot)
      expect(mockDb.getBot).toHaveBeenCalledWith('bot-1')
    })

    it('should get bots by workspace', async () => {
      const mockBots = [
        { id: 'bot-1', workspace_id: 'workspace-1', name: 'Bot 1', config: {}, created_at: '' },
        { id: 'bot-2', workspace_id: 'workspace-1', name: 'Bot 2', config: {}, created_at: '' }
      ]

      mockDb.getWorkspaceBots.mockResolvedValue(mockBots)

      const result = await botService.getWorkspaceBots('workspace-1')

      expect(result).toEqual(mockBots)
      expect(mockDb.getWorkspaceBots).toHaveBeenCalledWith('workspace-1')
    })
  })

  describe('Bot Updates', () => {
    it('should update bot configuration', async () => {
      const updates = {
        name: 'Updated Bot',
        config: {
          greeting: 'Welcome!',
          primaryColor: '#10B981'
        }
      }

      const updatedBot = {
        id: 'bot-1',
        workspace_id: 'workspace-1',
        ...updates,
        created_at: new Date().toISOString()
      }

      mockDb.updateBot.mockResolvedValue(updatedBot)

      const result = await botService.updateBot('bot-1', updates)

      expect(result).toEqual(updatedBot)
      expect(mockDb.updateBot).toHaveBeenCalledWith('bot-1', updates)
    })
  })

  describe('Bot Deletion', () => {
    it('should delete a bot and its data', async () => {
      mockDb.deleteBot.mockResolvedValue(undefined)
      mockDb.clearBotEmbeddings.mockResolvedValue(undefined)
      mockVectorStore.deleteByNamespace.mockResolvedValue(undefined)

      await botService.deleteBot('bot-1')

      expect(mockDb.clearBotEmbeddings).toHaveBeenCalledWith('bot-1')
      expect(mockVectorStore.deleteByNamespace).toHaveBeenCalledWith('bot-1')
      expect(mockDb.deleteBot).toHaveBeenCalledWith('bot-1')
    })
  })

  describe('Bot Analytics', () => {
    it('should get bot analytics', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          bot_id: 'bot-1',
          session_id: 'session-1',
          messages: [
            { role: 'user' as const, content: 'Hello' },
            { role: 'assistant' as const, content: 'Hi there!' }
          ],
          created_at: new Date().toISOString()
        },
        {
          id: 'conv-2',
          bot_id: 'bot-1',
          session_id: 'session-2',
          messages: [
            { role: 'user' as const, content: 'Help' }
          ],
          created_at: new Date().toISOString()
        }
      ]

      mockDb.getBotConversations.mockResolvedValue(mockConversations)

      const analytics = await botService.getBotAnalytics('bot-1')

      expect(analytics).toEqual({
        totalConversations: 2,
        totalMessages: 3,
        averageMessagesPerConversation: 1.5,
        recentConversations: mockConversations
      })
    })
  })
})