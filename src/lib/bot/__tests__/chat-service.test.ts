import 'openai/shims/node';
import { ChatService } from '../chat-service';
import { EmbeddingService } from '../../embeddings/embeddings';
import { VectorSearchService } from '../../vector/vector-search';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('openai');
jest.mock('../../embeddings/embeddings');
jest.mock('../../vector/vector-search');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

describe('ChatService', () => {
  let service: ChatService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockVectorService: jest.Mocked<VectorSearchService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create service instance
    service = new ChatService({
      openaiApiKey: 'test-openai-key',
      pineconeApiKey: 'test-pinecone-key',
      pineconeIndexName: 'test-index',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500,
      topK: 5,
      systemPrompt: 'You are a helpful assistant.'
    });

    // Get mock instances
    mockOpenAI = (OpenAI as jest.MockedClass<typeof OpenAI>).mock.instances[0] as any;
    mockEmbeddingService = (EmbeddingService as jest.MockedClass<typeof EmbeddingService>).mock.instances[0] as any;
    mockVectorService = (VectorSearchService as jest.MockedClass<typeof VectorSearchService>).mock.instances[0] as any;
  });

  describe('createSession', () => {
    it('should create a new chat session', async () => {
      const sessionId = await service.createSession('bot-123', {
        user: 'test-user'
      });

      expect(sessionId).toBe('test-uuid');
      expect(service.getSessionCount()).toBe(1);
    });
  });

  describe('sendMessage', () => {
    let sessionId: string;

    beforeEach(async () => {
      sessionId = await service.createSession('bot-123');
      
      // Mock vector search results
      mockVectorService.setEmbeddingService = jest.fn();
      mockVectorService.similaritySearch = jest.fn().mockResolvedValue([
        {
          id: 'doc-1',
          text: 'Relevant context about the topic',
          score: 0.95,
          metadata: { url: 'https://example.com/doc1' }
        },
        {
          id: 'doc-2',
          text: 'More relevant information',
          score: 0.88,
          metadata: { url: 'https://example.com/doc2' }
        }
      ]);

      // Mock OpenAI completion
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'This is the AI response based on the context.'
              }
            }]
          })
        }
      } as any;
    });

    it('should send a message and get a response', async () => {
      const response = await service.sendMessage(
        sessionId,
        'What is the topic about?'
      );

      expect(response.message).toBe('This is the AI response based on the context.');
      expect(response.sessionId).toBe(sessionId);
      expect(response.messageId).toBe('test-uuid');
      expect(response.sources).toHaveLength(2);
      expect(response.sources[0].url).toBe('https://example.com/doc1');

      // Verify vector search was called
      expect(mockVectorService.similaritySearch).toHaveBeenCalledWith(
        'What is the topic about?',
        5,
        'bot-123'
      );

      // Verify OpenAI was called with context
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should maintain conversation history', async () => {
      // Send first message
      await service.sendMessage(sessionId, 'First question');
      
      // Send second message
      await service.sendMessage(sessionId, 'Follow-up question');

      const history = await service.getSessionHistory(sessionId);
      expect(history).toHaveLength(4); // 2 user + 2 assistant messages
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('First question');
      expect(history[2].role).toBe('user');
      expect(history[2].content).toBe('Follow-up question');
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        service.sendMessage('invalid-session', 'Message')
      ).rejects.toThrow('Session not found');
    });
  });

  describe('streamMessage', () => {
    let sessionId: string;

    beforeEach(async () => {
      sessionId = await service.createSession('bot-123');
      
      mockVectorService.setEmbeddingService = jest.fn();
      mockVectorService.similaritySearch = jest.fn().mockResolvedValue([
        {
          id: 'doc-1',
          text: 'Context',
          score: 0.95,
          metadata: {}
        }
      ]);
    });

    it('should stream message chunks', async () => {
      const chunks: string[] = [];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: ' world' } }] };
          yield { choices: [{ delta: { content: '!' } }] };
        }
      };

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue(mockStream)
        }
      } as any;

      const response = await service.streamMessage(
        sessionId,
        'Say hello',
        (chunk) => chunks.push(chunk)
      );

      expect(chunks).toEqual(['Hello', ' world', '!']);
      expect(response.message).toBe('Hello world!');
    });
  });

  describe('session management', () => {
    it('should get session by ID', async () => {
      const sessionId = await service.createSession('bot-123', {
        test: true
      });

      const session = await service.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.botId).toBe('bot-123');
      expect(session?.metadata?.test).toBe(true);
    });

    it('should clear session history', async () => {
      const sessionId = await service.createSession('bot-123');
      
      // Add mock message
      const session = await service.getSession(sessionId);
      session?.messages.push({
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date()
      });

      await service.clearSession(sessionId);
      
      const history = await service.getSessionHistory(sessionId);
      expect(history).toHaveLength(0);
    });

    it('should delete session', async () => {
      const sessionId = await service.createSession('bot-123');
      expect(service.getSessionCount()).toBe(1);

      await service.deleteSession(sessionId);
      expect(service.getSessionCount()).toBe(0);
      
      const session = await service.getSession(sessionId);
      expect(session).toBeUndefined();
    });

    it('should list active sessions', async () => {
      const id1 = await service.createSession('bot-123');
      const id2 = await service.createSession('bot-456');

      const sessions = service.getActiveSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions).toContain(id1);
      expect(sessions).toContain(id2);
    });
  });

  describe('searchSimilarContent', () => {
    it('should search for similar content', async () => {
      mockVectorService.setEmbeddingService = jest.fn();
      mockVectorService.similaritySearch = jest.fn().mockResolvedValue([
        {
          text: 'Similar content',
          score: 0.92,
          metadata: { source: 'doc1' }
        }
      ]);

      const results = await service.searchSimilarContent(
        'bot-123',
        'search query',
        3
      );

      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('Similar content');
      expect(results[0].score).toBe(0.92);
      expect(mockVectorService.similaritySearch).toHaveBeenCalledWith(
        'search query',
        3,
        'bot-123'
      );
    });
  });
});