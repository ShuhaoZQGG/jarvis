import { BotTrainingService } from '../training';
import { PlaywrightScraper } from '../../scraper/playwright-scraper';
import { EmbeddingService } from '../../embeddings/embeddings';
import { VectorSearchService } from '../../vector/vector-search';

// Mock dependencies
jest.mock('../../scraper/playwright-scraper');
jest.mock('../../embeddings/embeddings');
jest.mock('../../vector/vector-search');

describe('BotTrainingService', () => {
  let service: BotTrainingService;
  let mockScraper: jest.Mocked<PlaywrightScraper>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockVectorService: jest.Mocked<VectorSearchService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create service instance
    service = new BotTrainingService({
      openaiApiKey: 'test-openai-key',
      pineconeApiKey: 'test-pinecone-key',
      pineconeIndexName: 'test-index',
      maxDepth: 2,
      maxPages: 10,
      chunkSize: 512,
      overlapTokens: 50
    });

    // Get mock instances
    mockScraper = (PlaywrightScraper as jest.MockedClass<typeof PlaywrightScraper>).mock.instances[0] as any;
    mockEmbeddingService = (EmbeddingService as jest.MockedClass<typeof EmbeddingService>).mock.instances[0] as any;
    mockVectorService = (VectorSearchService as jest.MockedClass<typeof VectorSearchService>).mock.instances[0] as any;
  });

  describe('trainFromUrl', () => {
    it('should successfully train from a single URL', async () => {
      // Mock scraper response
      mockScraper.initialize = jest.fn().mockResolvedValue(undefined);
      mockScraper.close = jest.fn().mockResolvedValue(undefined);
      mockScraper.scrapeWithLinks = jest.fn().mockResolvedValue([
        {
          url: 'https://example.com',
          title: 'Example Page',
          content: 'This is example content for testing purposes.',
          timestamp: new Date(),
          metadata: {}
        },
        {
          url: 'https://example.com/page2',
          title: 'Second Page',
          content: 'More content for testing.',
          timestamp: new Date(),
          metadata: {}
        }
      ]);

      // Mock embedding service
      mockEmbeddingService.chunkText = jest.fn().mockImplementation((text) => [
        { text: text.substring(0, 20), metadata: {}, index: 0 },
        { text: text.substring(20), metadata: {}, index: 1 }
      ]);

      // Mock vector service
      mockVectorService.setEmbeddingService = jest.fn();
      mockVectorService.indexChunkedDocuments = jest.fn().mockResolvedValue({
        upsertedCount: 4
      });

      // Train from URL
      const result = await service.trainFromUrl(
        'bot-123',
        'https://example.com',
        (progress) => {
          expect(progress.stage).toBeDefined();
          expect(progress.current).toBeGreaterThanOrEqual(0);
          expect(progress.total).toBeGreaterThan(0);
        }
      );

      // Verify results
      expect(result.documentsProcessed).toBe(2);
      expect(result.chunksCreated).toBe(4);
      expect(result.embeddingsGenerated).toBe(4);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);

      // Verify mocks were called
      expect(mockScraper.initialize).toHaveBeenCalled();
      expect(mockScraper.scrapeWithLinks).toHaveBeenCalledWith(
        'https://example.com',
        2,
        10
      );
      expect(mockVectorService.indexChunkedDocuments).toHaveBeenCalled();
      expect(mockScraper.close).toHaveBeenCalled();
    });

    it('should handle scraping errors gracefully', async () => {
      mockScraper.initialize = jest.fn().mockResolvedValue(undefined);
      mockScraper.close = jest.fn().mockResolvedValue(undefined);
      mockScraper.scrapeWithLinks = jest.fn().mockRejectedValue(
        new Error('Failed to scrape')
      );

      await expect(
        service.trainFromUrl('bot-123', 'https://example.com')
      ).rejects.toThrow('Failed to scrape');

      expect(mockScraper.close).toHaveBeenCalled();
    });
  });

  describe('trainFromUrls', () => {
    it('should train from multiple URLs', async () => {
      mockScraper.initialize = jest.fn().mockResolvedValue(undefined);
      mockScraper.close = jest.fn().mockResolvedValue(undefined);
      mockScraper.scrapeMultipleUrls = jest.fn().mockResolvedValue([
        {
          url: 'https://example.com/1',
          title: 'Page 1',
          content: 'Content 1',
          timestamp: new Date(),
          metadata: {}
        },
        {
          url: 'https://example.com/2',
          title: 'Page 2',
          content: 'Content 2',
          timestamp: new Date(),
          metadata: {}
        }
      ]);

      mockEmbeddingService.chunkText = jest.fn().mockImplementation((text) => [
        { text, metadata: {}, index: 0 }
      ]);

      mockVectorService.setEmbeddingService = jest.fn();
      mockVectorService.indexChunkedDocuments = jest.fn().mockResolvedValue({
        upsertedCount: 1
      });

      const result = await service.trainFromUrls(
        'bot-123',
        ['https://example.com/1', 'https://example.com/2']
      );

      expect(result.documentsProcessed).toBe(2);
      expect(result.chunksCreated).toBe(2);
      expect(result.embeddingsGenerated).toBe(2);
      expect(mockScraper.scrapeMultipleUrls).toHaveBeenCalledWith(
        ['https://example.com/1', 'https://example.com/2'],
        3
      );
    });
  });

  describe('trainFromContent', () => {
    it('should train from manual content', async () => {
      const content = 'This is manual content for the chatbot to learn.';
      const metadata = { source: 'manual', author: 'test' };

      mockEmbeddingService.chunkText = jest.fn().mockReturnValue([
        { text: content, metadata: {}, index: 0 }
      ]);

      mockVectorService.setEmbeddingService = jest.fn();
      mockVectorService.indexChunkedDocuments = jest.fn().mockResolvedValue({
        upsertedCount: 1
      });

      const result = await service.trainFromContent(
        'bot-123',
        content,
        metadata
      );

      expect(result.documentsProcessed).toBe(1);
      expect(result.chunksCreated).toBe(1);
      expect(result.embeddingsGenerated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('deleteTrainingData', () => {
    it('should delete all training data for a bot', async () => {
      mockVectorService.setEmbeddingService = jest.fn();
      mockVectorService.deleteAll = jest.fn().mockResolvedValue(undefined);

      await service.deleteTrainingData('bot-123');

      expect(mockVectorService.deleteAll).toHaveBeenCalledWith('bot-123');
    });
  });

  describe('getTrainingStats', () => {
    it('should return training statistics', async () => {
      const stats = await service.getTrainingStats('bot-123');

      expect(stats).toHaveProperty('totalDocuments');
      expect(stats).toHaveProperty('totalChunks');
      expect(stats).toHaveProperty('lastUpdated');
    });
  });
});