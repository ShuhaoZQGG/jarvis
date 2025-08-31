import { VectorSearchService } from './vector-search';
import { Pinecone } from '@pinecone-database/pinecone';

jest.mock('@pinecone-database/pinecone');

describe('VectorSearchService', () => {
  let service: VectorSearchService;
  let mockPinecone: jest.Mocked<Pinecone>;
  let mockIndex: any;

  beforeEach(() => {
    mockIndex = {
      namespace: jest.fn().mockReturnThis(),
      upsert: jest.fn(),
      query: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      deleteAll: jest.fn()
    };

    mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex)
    } as any;

    (Pinecone as jest.MockedClass<typeof Pinecone>).mockImplementation(() => mockPinecone);
    
    service = new VectorSearchService({
      apiKey: 'test-api-key',
      environment: 'test-env',
      indexName: 'test-index'
    });
  });

  describe('upsert', () => {
    it('should upsert vectors to Pinecone', async () => {
      const vectors = [
        {
          id: 'vec1',
          values: new Array(1536).fill(0),
          metadata: { text: 'Hello world', url: 'https://example.com' }
        },
        {
          id: 'vec2',
          values: new Array(1536).fill(0),
          metadata: { text: 'Test content', url: 'https://example.com/test' }
        }
      ];

      mockIndex.upsert.mockResolvedValueOnce({ upsertedCount: 2 });

      const result = await service.upsert(vectors, 'test-namespace');

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.upsert).toHaveBeenCalledWith(vectors);
      expect(result).toEqual({ upsertedCount: 2 });
    });

    it('should handle batch upserts for large datasets', async () => {
      const vectors = new Array(150).fill(null).map((_, i) => ({
        id: `vec${i}`,
        values: new Array(1536).fill(0),
        metadata: { text: `Text ${i}` }
      }));

      mockIndex.upsert.mockResolvedValue({ upsertedCount: 100 });

      await service.upsertBatch(vectors, 'test-namespace');

      // Should be called twice (100 + 50)
      expect(mockIndex.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('query', () => {
    it('should query similar vectors', async () => {
      const queryVector = new Array(1536).fill(0);
      const mockResults = {
        matches: [
          {
            id: 'vec1',
            score: 0.95,
            values: [],
            metadata: { text: 'Similar content' }
          },
          {
            id: 'vec2',
            score: 0.85,
            values: [],
            metadata: { text: 'Related content' }
          }
        ]
      };

      mockIndex.query.mockResolvedValueOnce(mockResults);

      const results = await service.query({
        vector: queryVector,
        topK: 5,
        namespace: 'test-namespace',
        includeMetadata: true
      });

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        includeValues: false
      });
      expect(results.matches).toHaveLength(2);
      expect(results.matches[0].score).toBe(0.95);
    });

    it('should filter results by metadata', async () => {
      const queryVector = new Array(1536).fill(0);
      const filter = { url: { $eq: 'https://example.com' } };

      mockIndex.query.mockResolvedValueOnce({ matches: [] });

      await service.query({
        vector: queryVector,
        topK: 5,
        namespace: 'test-namespace',
        filter
      });

      expect(mockIndex.query).toHaveBeenCalledWith(
        expect.objectContaining({
          filter
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete a single vector', async () => {
      mockIndex.deleteOne.mockResolvedValueOnce({});

      await service.deleteOne('vec1', 'test-namespace');

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.deleteOne).toHaveBeenCalledWith('vec1');
    });

    it('should delete multiple vectors', async () => {
      mockIndex.deleteMany.mockResolvedValueOnce({});

      await service.deleteMany(['vec1', 'vec2', 'vec3'], 'test-namespace');

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.deleteMany).toHaveBeenCalledWith(['vec1', 'vec2', 'vec3']);
    });

    it('should delete all vectors in namespace', async () => {
      mockIndex.deleteAll.mockResolvedValueOnce({});

      await service.deleteAll('test-namespace');

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.deleteAll).toHaveBeenCalled();
    });
  });

  describe('similaritySearch', () => {
    it('should perform similarity search with text', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const mockResults = {
        matches: [
          {
            id: 'vec1',
            score: 0.92,
            metadata: { text: 'Relevant content', url: 'https://example.com/page1' }
          }
        ]
      };

      // Mock embedding generation
      service.generateEmbedding = jest.fn().mockResolvedValueOnce(mockEmbedding);
      mockIndex.query.mockResolvedValueOnce(mockResults);

      const results = await service.similaritySearch(
        'search query',
        5,
        'test-namespace'
      );

      expect(service.generateEmbedding).toHaveBeenCalledWith('search query');
      expect(mockIndex.query).toHaveBeenCalledWith(
        expect.objectContaining({
          vector: mockEmbedding,
          topK: 5
        })
      );
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('Relevant content');
      expect(results[0].score).toBe(0.92);
    });

    it('should handle empty search results', async () => {
      const mockEmbedding = new Array(1536).fill(0);
      
      service.generateEmbedding = jest.fn().mockResolvedValueOnce(mockEmbedding);
      mockIndex.query.mockResolvedValueOnce({ matches: [] });

      const results = await service.similaritySearch(
        'search query',
        5,
        'test-namespace'
      );

      expect(results).toEqual([]);
    });
  });
});