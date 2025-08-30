import { ChatService } from './chat'
import { VectorStore } from '../vectorstore/vectorstore'
import { EmbeddingsGenerator } from '../embeddings/embeddings'
import OpenAI from 'openai'

jest.mock('../vectorstore/vectorstore')
jest.mock('../embeddings/embeddings')
jest.mock('openai')

describe('ChatService', () => {
  let chatService: ChatService
  let mockVectorStore: jest.Mocked<VectorStore>
  let mockEmbeddingsGenerator: jest.Mocked<EmbeddingsGenerator>
  let mockOpenAI: jest.Mocked<OpenAI>

  beforeEach(() => {
    mockVectorStore = {
      query: jest.fn(),
    } as any

    mockEmbeddingsGenerator = {
      generateEmbedding: jest.fn(),
    } as any

    const mockCreate = jest.fn()
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as any

    ;(VectorStore as jest.MockedClass<typeof VectorStore>).mockImplementation(() => mockVectorStore)
    ;(EmbeddingsGenerator as jest.MockedClass<typeof EmbeddingsGenerator>).mockImplementation(() => mockEmbeddingsGenerator)
    ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI)

    chatService = new ChatService({
      openaiApiKey: 'test-key',
      vectorStore: mockVectorStore,
      embeddingsGenerator: mockEmbeddingsGenerator,
    })
  })

  describe('chat', () => {
    it('should generate response based on context', async () => {
      const mockEmbedding = new Array(1536).fill(0)
      const mockContext = [
        {
          id: 'doc-1',
          score: 0.95,
          metadata: {
            content: 'Our company offers 24/7 customer support.',
          },
        },
        {
          id: 'doc-2',
          score: 0.85,
          metadata: {
            content: 'We have offices in New York and San Francisco.',
          },
        },
      ]

      mockEmbeddingsGenerator.generateEmbedding.mockResolvedValue(mockEmbedding)
      mockVectorStore.query.mockResolvedValue(mockContext)
      ;(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: 'We offer 24/7 customer support through various channels.',
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
      } as any)

      const response = await chatService.chat('Do you offer customer support?', 'test-namespace')

      expect(mockEmbeddingsGenerator.generateEmbedding).toHaveBeenCalledWith('Do you offer customer support?')
      expect(mockVectorStore.query).toHaveBeenCalledWith(mockEmbedding, 5, 'test-namespace')
      expect(response.answer).toBe('We offer 24/7 customer support through various channels.')
      expect(response.sources).toEqual(mockContext)
    })

    it('should handle no context found', async () => {
      mockEmbeddingsGenerator.generateEmbedding.mockResolvedValue(new Array(1536).fill(0))
      mockVectorStore.query.mockResolvedValue([])
      ;(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: "I don't have enough information to answer that question.",
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
      } as any)

      const response = await chatService.chat('Random question', 'test-namespace')

      expect(response.answer).toContain("don't have enough information")
      expect(response.sources).toEqual([])
    })

    it('should handle conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'What is your name?' },
        { role: 'assistant' as const, content: 'I am Jarvis, your AI assistant.' },
      ]

      mockEmbeddingsGenerator.generateEmbedding.mockResolvedValue(new Array(1536).fill(0))
      mockVectorStore.query.mockResolvedValue([])
      ;(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: 'As I mentioned, I am Jarvis.',
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
      } as any)

      const response = await chatService.chat('Who are you again?', 'test-namespace', { history })

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'What is your name?' }),
            expect.objectContaining({ role: 'assistant', content: 'I am Jarvis, your AI assistant.' }),
          ]),
        })
      )
    })
  })

  describe('streamChat', () => {
    it('should stream responses', async () => {
      const mockEmbedding = new Array(1536).fill(0)
      const mockContext = [
        {
          id: 'doc-1',
          score: 0.95,
          metadata: { content: 'Test content' },
        },
      ]

      mockEmbeddingsGenerator.generateEmbedding.mockResolvedValue(mockEmbedding)
      mockVectorStore.query.mockResolvedValue(mockContext)

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' } }] }
          yield { choices: [{ delta: { content: ' world' } }] }
        },
      }

      ;(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockStream as any)

      const stream = await chatService.streamChat('Test question', 'test-namespace')
      const chunks: string[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' world'])
    })
  })
})