/**
 * @jest-environment node
 */
import 'openai/shims/node';
import { RAGEngine } from './rag';
import { PineconeService } from '../vectors/pinecone';
import { EmbeddingService } from '../embeddings/embeddings';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('../vectors/pinecone');
jest.mock('../embeddings/embeddings');
jest.mock('openai');

describe('RAGEngine', () => {
  let ragEngine: RAGEngine;
  let mockPinecone: jest.Mocked<PineconeService>;
  let mockEmbeddings: jest.Mocked<EmbeddingService>;
  let mockOpenAI: any;

  beforeEach(() => {
    // Setup mocks
    mockPinecone = {
      initialize: jest.fn(),
      query: jest.fn(),
      upsert: jest.fn(),
      namespace: jest.fn().mockReturnThis(),
    } as any;

    mockEmbeddings = {
      generateEmbedding: jest.fn(),
      chunkText: jest.fn(),
      generateDocumentEmbeddings: jest.fn(),
    } as any;

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (PineconeService as jest.MockedClass<typeof PineconeService>).mockImplementation(() => mockPinecone);
    (EmbeddingService as jest.MockedClass<typeof EmbeddingService>).mockImplementation(() => mockEmbeddings);
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);

    ragEngine = new RAGEngine({
      openaiApiKey: 'test-key',
      pineconeApiKey: 'test-pinecone-key',
      pineconeEnvironment: 'test-env',
      pineconeIndexName: 'test-index',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize all services', async () => {
      await ragEngine.initialize();

      expect(mockPinecone.initialize).toHaveBeenCalled();
    });
  });

  describe('indexDocument', () => {
    it('should chunk, embed, and store document', async () => {
      const document = {
        content: 'This is a test document with some content.',
        metadata: {
          url: 'https://example.com/page',
          title: 'Test Page',
        },
      };

      const chunks = [
        { text: 'This is a test', metadata: document.metadata, index: 0 },
        { text: 'document with some content', metadata: document.metadata, index: 1 },
      ];

      const embeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ];

      mockEmbeddings.chunkText.mockReturnValue(chunks);
      mockEmbeddings.generateDocumentEmbeddings.mockResolvedValue(
        chunks.map((chunk, i) => ({
          text: chunk.text,
          embedding: embeddings[i],
          metadata: chunk.metadata,
        }))
      );

      await ragEngine.indexDocument('bot-123', document);

      expect(mockEmbeddings.chunkText).toHaveBeenCalledWith(
        document.content,
        512,
        document.metadata,
        50
      );

      expect(mockPinecone.upsert).toHaveBeenCalledWith(
        'bot-123',
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            values: embeddings[0],
            metadata: expect.objectContaining({
              text: chunks[0].text,
              ...document.metadata,
            }),
          }),
        ])
      );
    });

    it('should handle multiple documents', async () => {
      const documents = [
        { content: 'Document 1', metadata: { source: 'doc1' } },
        { content: 'Document 2', metadata: { source: 'doc2' } },
      ];

      mockEmbeddings.chunkText.mockReturnValue([{ text: 'chunk', metadata: {}, index: 0 }]);
      mockEmbeddings.generateDocumentEmbeddings.mockResolvedValue([
        { text: 'chunk', embedding: [0.1], metadata: {} },
      ]);

      await ragEngine.indexDocuments('bot-123', documents);

      expect(mockEmbeddings.chunkText).toHaveBeenCalledTimes(2);
      expect(mockPinecone.upsert).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should retrieve relevant context and generate response', async () => {
      const query = 'What is the main feature?';
      const queryEmbedding = [0.1, 0.2, 0.3];
      const contexts = [
        {
          id: 'chunk1',
          score: 0.95,
          metadata: {
            text: 'The main feature is AI-powered chat.',
            url: 'https://example.com/features',
          },
        },
        {
          id: 'chunk2',
          score: 0.85,
          metadata: {
            text: 'It includes real-time responses.',
            url: 'https://example.com/features',
          },
        },
      ];

      const aiResponse = 'The main feature is AI-powered chat with real-time responses.';

      mockEmbeddings.generateEmbedding.mockResolvedValue(queryEmbedding);
      mockPinecone.query.mockResolvedValue(contexts);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: aiResponse } }],
      });

      const response = await ragEngine.query('bot-123', query);

      expect(mockEmbeddings.generateEmbedding).toHaveBeenCalledWith(query);
      expect(mockPinecone.query).toHaveBeenCalledWith('bot-123', queryEmbedding, 5);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: query }),
          ]),
        })
      );
      expect(response).toEqual({
        answer: aiResponse,
        sources: contexts,
      });
    });

    it('should handle queries with no relevant context', async () => {
      const query = 'Completely unrelated question';
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1, 0.2]);
      mockPinecone.query.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'I don\'t have information about that.' } }],
      });

      const response = await ragEngine.query('bot-123', query);

      expect(response.sources).toEqual([]);
      expect(response.answer).toContain('don\'t have information');
    });

    it('should apply filters when querying', async () => {
      const query = 'What are the pricing plans?';
      const filter = { category: 'pricing' };

      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1, 0.2]);
      mockPinecone.query.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Pricing info' } }],
      });

      await ragEngine.query('bot-123', query, { filter });

      expect(mockPinecone.query).toHaveBeenCalledWith(
        'bot-123',
        [0.1, 0.2],
        5,
        filter
      );
    });
  });

  describe('conversation management', () => {
    it('should maintain conversation history', async () => {
      const conversation = ragEngine.createConversation('bot-123');
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1]);
      mockPinecone.query.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response 1' } }],
      });

      await conversation.send('First question');
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response 2' } }],
      });

      await conversation.send('Follow-up question');

      const history = conversation.getHistory();
      expect(history).toHaveLength(4); // 2 questions + 2 responses
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('First question');
      expect(history[1].role).toBe('assistant');
      expect(history[2].role).toBe('user');
      expect(history[2].content).toBe('Follow-up question');
    });

    it('should clear conversation history', async () => {
      const conversation = ragEngine.createConversation('bot-123');
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1]);
      mockPinecone.query.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await conversation.send('Question');
      conversation.clear();

      expect(conversation.getHistory()).toHaveLength(0);
    });
  });

  describe('caching', () => {
    it('should cache frequent queries', async () => {
      const query = 'What is your return policy?';
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1]);
      mockPinecone.query.mockResolvedValue([
        { id: '1', score: 0.9, metadata: { text: 'Return policy info' } },
      ]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Return policy response' } }],
      });

      // First query
      await ragEngine.query('bot-123', query);
      
      // Second identical query
      await ragEngine.query('bot-123', query);

      // Should only call OpenAI once due to caching
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      jest.useFakeTimers();
      
      const query = 'Cached question';
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1]);
      mockPinecone.query.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Cached response' } }],
      });

      await ragEngine.query('bot-123', query);
      
      // Advance time beyond cache TTL (default 1 hour)
      jest.advanceTimersByTime(3600001);
      
      await ragEngine.query('bot-123', query);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      const query = 'Test query';
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1]);
      mockPinecone.query.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      await expect(ragEngine.query('bot-123', query)).rejects.toThrow('Failed to generate response');
    });

    it('should handle Pinecone query errors', async () => {
      const query = 'Test query';
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1]);
      mockPinecone.query.mockRejectedValue(new Error('Pinecone error'));

      await expect(ragEngine.query('bot-123', query)).rejects.toThrow('Failed to retrieve context');
    });
  });

  describe('streaming responses', () => {
    it('should support streaming responses', async () => {
      const query = 'Stream this response';
      const chunks = ['The ', 'answer ', 'is ', 'streaming.'];
      
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1]);
      mockPinecone.query.mockResolvedValue([]);
      
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield { choices: [{ delta: { content: chunk } }] };
          }
        },
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValue(mockStream);

      const onChunk = jest.fn();
      await ragEngine.queryStream('bot-123', query, onChunk);

      expect(onChunk).toHaveBeenCalledTimes(chunks.length);
      chunks.forEach((chunk, index) => {
        expect(onChunk).toHaveBeenNthCalledWith(index + 1, chunk);
      });
    });
  });
});