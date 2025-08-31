import { PineconeService } from './pinecone';
import { Pinecone } from '@pinecone-database/pinecone';

// Mock Pinecone
jest.mock('@pinecone-database/pinecone');

describe('PineconeService', () => {
  let service: PineconeService;
  let mockIndex: any;
  let mockPinecone: any;

  beforeEach(() => {
    mockIndex = {
      namespace: jest.fn().mockReturnThis(),
      upsert: jest.fn(),
      query: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      deleteAll: jest.fn(),
      describeIndexStats: jest.fn(),
    };

    mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
      createIndex: jest.fn(),
      listIndexes: jest.fn().mockResolvedValue({
        indexes: [{ name: 'test-index' }]
      }),
    };

    (Pinecone as jest.MockedClass<typeof Pinecone>).mockImplementation(() => mockPinecone);

    service = new PineconeService({
      apiKey: 'test-api-key',
      environment: 'test-environment',
      indexName: 'test-index',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize Pinecone client with correct config', async () => {
      await service.initialize();
      
      expect(Pinecone).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
      expect(mockPinecone.index).toHaveBeenCalledWith('test-index');
    });

    it('should create index if it does not exist', async () => {
      // First call returns no indexes, subsequent calls return the created index as ready
      mockPinecone.listIndexes
        .mockResolvedValueOnce({ indexes: [] })
        .mockResolvedValue({ 
          indexes: [{ 
            name: 'test-index',
            status: { ready: true }
          }] 
        });
      
      await service.initialize();
      
      expect(mockPinecone.createIndex).toHaveBeenCalledWith({
        name: 'test-index',
        dimension: 1536, // OpenAI ada-002 dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
    }, 10000);
  });

  describe('upsert', () => {
    it('should upsert vectors to a namespace', async () => {
      const vectors = [
        {
          id: 'vec1',
          values: [0.1, 0.2, 0.3],
          metadata: { text: 'sample text' },
        },
      ];

      await service.upsert('test-namespace', vectors);

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.upsert).toHaveBeenCalledWith(vectors);
    });

    it('should handle batch upserts for large datasets', async () => {
      const vectors = Array.from({ length: 150 }, (_, i) => ({
        id: `vec${i}`,
        values: [0.1, 0.2, 0.3],
        metadata: { text: `text ${i}` },
      }));

      await service.upsert('test-namespace', vectors);

      // Should be called twice (100 + 50)
      expect(mockIndex.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('query', () => {
    it('should query vectors by similarity', async () => {
      const queryVector = [0.1, 0.2, 0.3];
      const mockResults = {
        matches: [
          { id: 'vec1', score: 0.95, metadata: { text: 'result 1' } },
          { id: 'vec2', score: 0.85, metadata: { text: 'result 2' } },
        ],
      };

      mockIndex.query.mockResolvedValue(mockResults);

      const results = await service.query('test-namespace', queryVector, 5);

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
      });
      expect(results).toEqual(mockResults.matches);
    });

    it('should apply filters when querying', async () => {
      const queryVector = [0.1, 0.2, 0.3];
      const filter = { category: 'docs' };
      const mockResults = {
        matches: [
          { id: 'vec1', score: 0.95, metadata: { text: 'result 1' } },
        ],
      };

      mockIndex.query.mockResolvedValue(mockResults);

      await service.query('test-namespace', queryVector, 5, filter);

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        filter,
      });
    });
  });

  describe('delete', () => {
    it('should delete a single vector by id', async () => {
      await service.deleteVector('test-namespace', 'vec1');

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.deleteOne).toHaveBeenCalledWith('vec1');
    });

    it('should delete multiple vectors by ids', async () => {
      await service.deleteVectors('test-namespace', ['vec1', 'vec2', 'vec3']);

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.deleteMany).toHaveBeenCalledWith(['vec1', 'vec2', 'vec3']);
    });

    it('should delete all vectors in a namespace', async () => {
      await service.deleteNamespace('test-namespace');

      expect(mockIndex.namespace).toHaveBeenCalledWith('test-namespace');
      expect(mockIndex.deleteAll).toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('should get index statistics', async () => {
      const mockStats = {
        namespaces: {
          'test-namespace': {
            vectorCount: 1000,
          },
        },
        dimension: 1536,
        indexFullness: 0.1,
      };

      mockIndex.describeIndexStats.mockResolvedValue(mockStats);

      const stats = await service.getStats();

      expect(mockIndex.describeIndexStats).toHaveBeenCalled();
      expect(stats).toEqual(mockStats);
    });
  });

  describe('namespace management', () => {
    it('should create namespace-specific operations', async () => {
      const namespace = service.namespace('bot-123');
      
      const vectors = [
        { id: 'vec1', values: [0.1, 0.2], metadata: { text: 'test' } },
      ];
      
      await namespace.upsert(vectors);
      
      expect(mockIndex.namespace).toHaveBeenCalledWith('bot-123');
      expect(mockIndex.upsert).toHaveBeenCalledWith(vectors);
    });
  });
});