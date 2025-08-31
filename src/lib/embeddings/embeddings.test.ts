/**
 * @jest-environment node
 */

import 'openai/shims/node'
import { EmbeddingsGenerator, EmbeddingService } from './embeddings'
import OpenAI from 'openai'

jest.mock('openai')

describe('EmbeddingsGenerator', () => {
  let generator: EmbeddingsGenerator
  let mockOpenAI: jest.Mocked<OpenAI>

  beforeEach(() => {
    const mockCreate = jest.fn()
    mockOpenAI = {
      embeddings: {
        create: mockCreate,
      },
    } as any

    ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI)
    generator = new EmbeddingsGenerator('test-api-key')
  })

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      ;(mockOpenAI.embeddings.create as jest.Mock).mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      } as any)

      const result = await generator.generateEmbedding('Test text for embedding')

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: 'Test text for embedding',
      })
      expect(result).toEqual(mockEmbedding)
      expect(result).toHaveLength(1536)
    })

    it('should handle empty text', async () => {
      // The actual implementation returns empty array for empty text
      const result = await generator.generateEmbedding('')
      expect(result).toEqual([])
    })

    it('should handle API errors', async () => {
      ;(mockOpenAI.embeddings.create as jest.Mock).mockRejectedValue(new Error('API Error'))

      await expect(generator.generateEmbedding('Test text')).rejects.toThrow('Failed to generate embedding')
    })
  })

  describe('generateBatchEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = ['Text 1', 'Text 2', 'Text 3']
      const mockEmbeddings = texts.map(() => 
        new Array(1536).fill(0).map(() => Math.random())
      )

      ;(mockOpenAI.embeddings.create as jest.Mock).mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding })),
        model: 'text-embedding-ada-002',
        usage: { prompt_tokens: 30, total_tokens: 30 },
      } as any)

      const results = await generator.generateBatchEmbeddings(texts)

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: texts,
      })
      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        // generateBatchEmbeddings returns array of embeddings directly
        expect(result).toEqual(mockEmbeddings[index])
      })
    })

    it('should handle batch size limits', async () => {
      const texts = new Array(150).fill('Text')
      
      ;(mockOpenAI.embeddings.create as jest.Mock).mockImplementation(({ input }: any) => {
        const inputArray = Array.isArray(input) ? input : [input]
        const embeddings = inputArray.map(() => 
          new Array(1536).fill(0).map(() => Math.random())
        )
        return Promise.resolve({
          data: embeddings.map(embedding => ({ embedding })),
          model: 'text-embedding-ada-002',
          usage: { prompt_tokens: inputArray.length * 10, total_tokens: inputArray.length * 10 },
        } as any)
      })

      const results = await generator.generateBatchEmbeddings(texts)

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2)
      expect(results).toHaveLength(150)
    })
  })

  describe('chunkText', () => {
    it('should chunk text into smaller pieces', () => {
      const longText = 'This is a test. '.repeat(200)
      const chunks = generator.chunkText(longText, 100)

      expect(chunks.length).toBeGreaterThan(1)
      chunks.forEach(chunk => {
        // chunkText returns TextChunk objects with text property
        expect(chunk.text.length).toBeLessThanOrEqual(100 * 4) // maxTokens * 4 chars
      })
    })

    it('should preserve sentence boundaries when chunking', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.'
      const chunks = generator.chunkText(text, 30)

      chunks.forEach((chunk, index) => {
        // TextChunk objects have text property
        expect(chunk.text.endsWith('.') || index === chunks.length - 1).toBe(true)
      })
    })
  })
})