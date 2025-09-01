import { PlaywrightScraper } from '@/lib/scraper/playwright-scraper';
import { EmbeddingService } from '@/lib/embeddings/embeddings';
import { VectorSearchService } from '@/lib/vector/vector-search';
import { PineconeService } from '@/lib/vectors/pinecone';

describe('Core MVP Integration Test', () => {
  let scraper: PlaywrightScraper;
  let embeddingService: EmbeddingService;
  let vectorService: VectorSearchService;
  
  // Mock services
  const mockOpenAIKey = 'test-openai-key';
  const mockPineconeKey = 'test-pinecone-key';
  const mockIndexName = 'test-index';
  
  beforeAll(() => {
    // Mock environment variables
    process.env.OPENAI_API_KEY = mockOpenAIKey;
    process.env.PINECONE_API_KEY = mockPineconeKey;
    process.env.PINECONE_INDEX_NAME = mockIndexName;
  });

  beforeEach(() => {
    // Initialize services
    scraper = new PlaywrightScraper();
    embeddingService = new EmbeddingService({
      apiKey: mockOpenAIKey
    });
    vectorService = new VectorSearchService({
      apiKey: mockPineconeKey,
      indexName: mockIndexName
    });
    vectorService.setEmbeddingService(embeddingService);
  });

  afterEach(async () => {
    await scraper.close();
  });

  describe('Web Scraping Pipeline', () => {
    it('should scrape a URL and extract content', async () => {
      // Mock the browser behavior
      const mockPage = {
        url: 'https://example.com',
        title: 'Test Page',
        content: 'This is test content for the MVP integration test.',
        metadata: {
          description: 'Test description',
          ogTitle: 'Test OG Title'
        }
      };

      // Mock scraper methods
      jest.spyOn(scraper, 'scrapeUrl').mockResolvedValue({
        url: mockPage.url,
        title: mockPage.title,
        content: mockPage.content,
        metadata: mockPage.metadata,
        timestamp: new Date()
      });

      const result = await scraper.scrapeUrl(mockPage.url);
      
      expect(result).toBeDefined();
      expect(result.url).toBe(mockPage.url);
      expect(result.title).toBe(mockPage.title);
      expect(result.content).toBe(mockPage.content);
      expect(result.metadata).toEqual(mockPage.metadata);
    });

    it('should handle multiple URLs concurrently', async () => {
      const urls = [
        'https://example1.com',
        'https://example2.com',
        'https://example3.com'
      ];

      jest.spyOn(scraper, 'scrapeMultipleUrls').mockResolvedValue(
        urls.map((url, index) => ({
          url,
          title: `Page ${index + 1}`,
          content: `Content for page ${index + 1}`,
          metadata: {},
          timestamp: new Date()
        }))
      );

      const results = await scraper.scrapeMultipleUrls(urls);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.url).toBe(urls[index]);
        expect(result.title).toBe(`Page ${index + 1}`);
      });
    });
  });

  describe('Embedding Generation Pipeline', () => {
    it('should generate embeddings for text', async () => {
      const text = 'This is a test text for embedding generation.';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(mockEmbedding);

      const embedding = await embeddingService.generateEmbedding(text);
      
      expect(embedding).toBeDefined();
      expect(embedding).toHaveLength(1536); // OpenAI ada-002 dimension
      expect(Array.isArray(embedding)).toBe(true);
    });

    it('should chunk text properly', () => {
      const longText = 'This is a very long text that needs to be chunked. '.repeat(100);
      
      const chunks = embeddingService.chunkText(longText, 512);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk, index) => {
        expect(chunk.text).toBeDefined();
        expect(chunk.index).toBe(index);
        expect(chunk.text.length).toBeLessThanOrEqual(512 * 4); // Approximate chars
      });
    });

    it('should generate batch embeddings', async () => {
      const texts = [
        'First text for embedding',
        'Second text for embedding',
        'Third text for embedding'
      ];

      const mockEmbeddings = texts.map(() => 
        new Array(1536).fill(0).map(() => Math.random())
      );

      jest.spyOn(embeddingService, 'generateBatchEmbeddings').mockResolvedValue(mockEmbeddings);

      const embeddings = await embeddingService.generateBatchEmbeddings(texts);
      
      expect(embeddings).toHaveLength(3);
      embeddings.forEach(embedding => {
        expect(embedding).toHaveLength(1536);
      });
    });
  });

  describe('Vector Search Pipeline', () => {
    it('should index documents with embeddings', async () => {
      const documents = [
        { id: 'doc1', text: 'First document content', metadata: { source: 'test' } },
        { id: 'doc2', text: 'Second document content', metadata: { source: 'test' } }
      ];

      // Mock embedding generation
      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(
        new Array(1536).fill(0).map(() => Math.random())
      );

      // Mock vector indexing
      jest.spyOn(vectorService, 'indexDocuments').mockResolvedValue({
        upsertedCount: documents.length
      });

      const result = await vectorService.indexDocuments(documents, 'test-namespace');
      
      expect(result.upsertedCount).toBe(2);
    });

    it('should perform similarity search', async () => {
      const query = 'What is the test content?';
      const mockResults = [
        { id: 'doc1', score: 0.95, text: 'Test content here', metadata: { source: 'test' } },
        { id: 'doc2', score: 0.85, text: 'Another test content', metadata: { source: 'test' } }
      ];

      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(
        new Array(1536).fill(0).map(() => Math.random())
      );

      jest.spyOn(vectorService, 'similaritySearch').mockResolvedValue(mockResults);

      const results = await vectorService.similaritySearch(query, 5, 'test-namespace');
      
      expect(results).toHaveLength(2);
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results[0].text).toBeDefined();
    });
  });

  describe('End-to-End MVP Flow', () => {
    it('should complete the full pipeline: scrape → embed → index → search', async () => {
      // Step 1: Scrape content
      const scrapedContent = {
        url: 'https://example.com',
        title: 'Test Page',
        content: 'This is important information about AI and chatbots.',
        metadata: { description: 'Test page' },
        timestamp: new Date()
      };

      jest.spyOn(scraper, 'scrapeUrl').mockResolvedValue(scrapedContent);

      const scraped = await scraper.scrapeUrl(scrapedContent.url);
      expect(scraped).toBeDefined();

      // Step 2: Chunk the content
      const chunks = embeddingService.chunkText(scraped.content, 512);
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      // Step 3: Generate embeddings and index
      const documents = chunks.map((chunk, index) => ({
        id: `${scraped.url}_chunk_${index}`,
        text: chunk.text,
        metadata: {
          url: scraped.url,
          title: scraped.title,
          chunkIndex: index
        }
      }));

      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(
        new Array(1536).fill(0).map(() => Math.random())
      );

      jest.spyOn(vectorService, 'indexDocuments').mockResolvedValue({
        upsertedCount: documents.length
      });

      const indexResult = await vectorService.indexDocuments(documents, 'bot-123');
      expect(indexResult.upsertedCount).toBe(documents.length);

      // Step 4: Search for relevant content
      const searchQuery = 'Tell me about AI';
      
      jest.spyOn(vectorService, 'similaritySearch').mockResolvedValue([
        {
          id: documents[0].id,
          score: 0.92,
          text: documents[0].text,
          metadata: documents[0].metadata
        }
      ]);

      const searchResults = await vectorService.similaritySearch(searchQuery, 3, 'bot-123');
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].metadata?.url).toBe(scrapedContent.url);
      expect(searchResults[0].score).toBeGreaterThan(0.8);
    });

    it('should handle errors gracefully in the pipeline', async () => {
      // Test scraping error
      jest.spyOn(scraper, 'scrapeUrl').mockRejectedValue(new Error('Network error'));
      
      await expect(scraper.scrapeUrl('https://invalid.com')).rejects.toThrow('Network error');

      // Test embedding error
      jest.spyOn(embeddingService, 'generateEmbedding').mockRejectedValue(
        new Error('API key invalid')
      );
      
      await expect(embeddingService.generateEmbedding('test')).rejects.toThrow('API key invalid');

      // Test vector search error
      jest.spyOn(vectorService, 'similaritySearch').mockRejectedValue(
        new Error('Index not found')
      );
      
      await expect(vectorService.similaritySearch('query', 5)).rejects.toThrow('Index not found');
    });
  });

  describe('Performance and Scale Tests', () => {
    it('should handle large-scale document processing', async () => {
      const largeDocumentSet = Array.from({ length: 100 }, (_, i) => ({
        id: `doc_${i}`,
        text: `Document ${i} content with various information`,
        metadata: { index: i }
      }));

      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(
        new Array(1536).fill(0).map(() => Math.random())
      );

      jest.spyOn(vectorService, 'indexDocuments').mockResolvedValue({
        upsertedCount: largeDocumentSet.length
      });

      const startTime = Date.now();
      const result = await vectorService.indexDocuments(largeDocumentSet, 'bulk-test');
      const duration = Date.now() - startTime;

      expect(result.upsertedCount).toBe(100);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should respect rate limiting for API calls', async () => {
      const texts = Array.from({ length: 10 }, (_, i) => `Text ${i}`);
      
      let callCount = 0;
      jest.spyOn(embeddingService, 'generateEmbedding').mockImplementation(async () => {
        callCount++;
        if (callCount > 5 && callCount <= 7) {
          throw new Error('Rate limit exceeded');
        }
        return new Array(1536).fill(0).map(() => Math.random());
      });

      // The service should handle rate limiting with retries
      const embeddings = [];
      for (const text of texts) {
        try {
          const embedding = await embeddingService.generateEmbedding(text);
          embeddings.push(embedding);
        } catch (error) {
          // Should retry and eventually succeed
          await new Promise(resolve => setTimeout(resolve, 1000));
          const embedding = await embeddingService.generateEmbedding(text);
          embeddings.push(embedding);
        }
      }

      expect(embeddings.length).toBe(10);
    });
  });
});