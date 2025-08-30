import { VectorStore } from './vectorstore'
import { Pinecone } from '@pinecone-database/pinecone'

jest.mock('@pinecone-database/pinecone')

describe('VectorStore', () => {
  let vectorStore: VectorStore
  let mockPinecone: jest.Mocked<Pinecone>
  let mockIndex: any

  beforeEach(() => {
    mockIndex = {
      namespace: jest.fn().mockReturnThis(),
      upsert: jest.fn(),
      query: jest.fn(),
      deleteMany: jest.fn(),
    }

    mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
    } as any

    ;(Pinecone as jest.MockedClass<typeof Pinecone>).mockImplementation(() => mockPinecone)
    
    vectorStore = new VectorStore({
      apiKey: 'test-api-key',
      environment: 'test-env',
      indexName: 'test-index',
    })
  })

  describe('upsertDocument', () => {
    it('should upsert a document with embedding', async () => {
      const doc = {
        id: 'doc-1',
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        metadata: {
          url: 'https://example.com',
          title: 'Test Page',
          content: 'Test content',
          timestamp: new Date().toISOString(),
        },
      }

      mockIndex.upsert.mockResolvedValue({ upsertedCount: 1 })

      await vectorStore.upsertDocument(doc)

      expect(mockIndex.namespace).toHaveBeenCalledWith('default')
      expect(mockIndex.upsert).toHaveBeenCalledWith([{
        id: doc.id,
        values: doc.embedding,
        metadata: doc.metadata,
      }])
    })

    it('should handle upsert errors', async () => {
      mockIndex.upsert.mockRejectedValue(new Error('Upsert failed'))

      const doc = {
        id: 'doc-1',
        embedding: new Array(1536).fill(0),
        metadata: { url: 'https://example.com' },
      }

      await expect(vectorStore.upsertDocument(doc)).rejects.toThrow('Failed to upsert document')
    })
  })

  describe('upsertBatch', () => {
    it('should upsert multiple documents', async () => {
      const docs = [
        {
          id: 'doc-1',
          embedding: new Array(1536).fill(0),
          metadata: { url: 'https://example1.com' },
        },
        {
          id: 'doc-2',
          embedding: new Array(1536).fill(0),
          metadata: { url: 'https://example2.com' },
        },
      ]

      mockIndex.upsert.mockResolvedValue({ upsertedCount: 2 })

      await vectorStore.upsertBatch(docs)

      expect(mockIndex.upsert).toHaveBeenCalledWith(
        docs.map(doc => ({
          id: doc.id,
          values: doc.embedding,
          metadata: doc.metadata,
        }))
      )
    })

    it('should handle batch size limits', async () => {
      const docs = new Array(150).fill(null).map((_, i) => ({
        id: `doc-${i}`,
        embedding: new Array(1536).fill(0),
        metadata: { url: `https://example${i}.com` },
      }))

      mockIndex.upsert.mockResolvedValue({ upsertedCount: 100 })

      await vectorStore.upsertBatch(docs)

      expect(mockIndex.upsert).toHaveBeenCalledTimes(2)
    })
  })

  describe('query', () => {
    it('should query similar documents', async () => {
      const queryEmbedding = new Array(1536).fill(0).map(() => Math.random())
      const mockResults = {
        matches: [
          {
            id: 'doc-1',
            score: 0.95,
            metadata: {
              url: 'https://example.com',
              title: 'Test Page',
              content: 'Test content',
            },
          },
          {
            id: 'doc-2',
            score: 0.85,
            metadata: {
              url: 'https://example2.com',
              title: 'Another Page',
              content: 'More content',
            },
          },
        ],
      }

      mockIndex.query.mockResolvedValue(mockResults)

      const results = await vectorStore.query(queryEmbedding, 5)

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
      })
      expect(results).toEqual(mockResults.matches)
    })

    it('should handle query errors', async () => {
      mockIndex.query.mockRejectedValue(new Error('Query failed'))

      await expect(vectorStore.query(new Array(1536).fill(0), 5)).rejects.toThrow('Failed to query')
    })
  })

  describe('deleteByNamespace', () => {
    it('should delete all documents in a namespace', async () => {
      mockIndex.deleteMany.mockResolvedValue({})

      await vectorStore.deleteByNamespace('test-namespace')

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace')
      expect(mockIndex.deleteMany).toHaveBeenCalledWith({ deleteAll: true })
    })
  })
})