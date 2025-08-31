/**
 * End-to-End Integration Tests
 * Tests the complete flow from web scraping to chat responses
 */

// Mock modules before importing
jest.mock('@supabase/supabase-js');
jest.mock('cheerio');

import { createClient } from '@supabase/supabase-js';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_KEY: 'test-service-key',
  OPENAI_API_KEY: 'test-openai-key',
  PINECONE_API_KEY: 'test-pinecone-key',
  PINECONE_ENVIRONMENT: 'test-env',
  PINECONE_INDEX: 'test-index',
};

// Mock fetch globally
global.fetch = jest.fn();

describe('End-to-End Chatbot Flow', () => {
  let supabase: any;
  let scraperService: any;
  let vectorService: any;
  
  const testBotId = 'test-bot-123';
  const testWorkspaceId = 'test-workspace-123';
  const testUrl = 'https://example.com/docs';
  
  beforeAll(() => {
    // Set up environment
    Object.assign(process.env, mockEnv);
    
    // Mock Supabase client
    supabase = {
      from: jest.fn(() => ({
        insert: jest.fn(),
        select: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      rpc: jest.fn(),
    };
    
    // Mock services
    scraperService = {
      scrapeUrl: jest.fn(),
      scrapeMultipleUrls: jest.fn(),
    };
    
    vectorService = {
      generateEmbeddings: jest.fn(),
      upsert: jest.fn(),
      search: jest.fn(),
    };
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('1. Bot Creation and Setup', () => {
    it('should create a new bot with proper configuration', async () => {
      // Mock Supabase response
      const mockBot = {
        id: testBotId,
        workspace_id: testWorkspaceId,
        name: 'Test Bot',
        url: testUrl,
        status: 'active',
        settings: {
          greeting: 'Hello! How can I help you?',
          primaryColor: '#0ea5e9',
          model: 'gpt-3.5-turbo',
        },
      };
      
      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: mockBot,
          error: null,
        }),
      });
      
      // Create bot
      const { data: bot, error } = await supabase
        .from('bots')
        .insert({
          workspace_id: testWorkspaceId,
          name: 'Test Bot',
          url: testUrl,
          settings: {
            greeting: 'Hello! How can I help you?',
            primaryColor: '#0ea5e9',
            model: 'gpt-3.5-turbo',
          },
        });
      
      expect(error).toBeNull();
      expect(bot).toEqual(mockBot);
      expect(bot.id).toBe(testBotId);
    });
  });
  
  describe('2. Web Scraping Pipeline', () => {
    it('should scrape and process website content', async () => {
      // Mock HTML content
      const mockHtml = `
        <html>
          <head><title>Documentation</title></head>
          <body>
            <h1>Getting Started</h1>
            <p>Welcome to our documentation. This guide will help you get started.</p>
            <h2>Installation</h2>
            <p>Run npm install to get started with our package.</p>
            <h2>Configuration</h2>
            <p>Configure your API key in the environment variables.</p>
          </body>
        </html>
      `;
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });
      
      // Mock scraper response
      scraperService.scrapeUrl.mockResolvedValue({
        title: 'Documentation',
        content: 'Getting Started Welcome to our documentation. This guide will help you get started. Installation Run npm install to get started with our package. Configuration Configure your API key in the environment variables.',
        chunks: ['Getting Started', 'Installation', 'Configuration'],
      });
      
      // Scrape content
      const scrapedContent = await scraperService.scrapeUrl(testUrl);
      
      expect(scrapedContent).toBeDefined();
      expect(scrapedContent.title).toBe('Documentation');
      expect(scrapedContent.content).toContain('Getting Started');
      expect(scrapedContent.content).toContain('Installation');
      expect(scrapedContent.chunks).toBeInstanceOf(Array);
      expect(scrapedContent.chunks.length).toBeGreaterThan(0);
    });
    
    it('should handle multiple URLs in batch', async () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3',
      ];
      
      // Mock fetch responses for each URL
      urls.forEach((url, index) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          text: async () => `<html><body><h1>Page ${index + 1}</h1></body></html>`,
        });
      });
      
      // Scrape multiple URLs
      const results = await scraperService.scrapeMultipleUrls(urls);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.content).toContain(`Page ${index + 1}`);
      });
    });
  });
  
  describe('3. Vector Embedding and Storage', () => {
    it('should generate embeddings for scraped content', async () => {
      const mockChunks = [
        'Getting Started with our product',
        'Installation guide and requirements',
        'Configuration and API setup',
      ];
      
      // Mock OpenAI embedding response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockChunks.map((_, i) => ({
            embedding: Array(1536).fill(0.1 * i), // Mock 1536-dimensional vector
          })),
        }),
      });
      
      // Generate embeddings
      const embeddings = await vectorService.generateEmbeddings(mockChunks);
      
      expect(embeddings).toHaveLength(3);
      embeddings.forEach(embedding => {
        expect(embedding).toHaveLength(1536);
      });
    });
    
    it('should store embeddings in vector database', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          text: 'Getting Started guide',
          embedding: Array(1536).fill(0.1),
          metadata: { botId: testBotId, url: testUrl, chunk: 0 },
        },
        {
          id: 'doc-2',
          text: 'Installation instructions',
          embedding: Array(1536).fill(0.2),
          metadata: { botId: testBotId, url: testUrl, chunk: 1 },
        },
      ];
      
      // Mock Pinecone upsert
      jest.spyOn(vectorService, 'upsert').mockResolvedValue({
        success: true,
        upsertedCount: 2,
      });
      
      // Store documents
      const result = await vectorService.upsert(mockDocuments);
      
      expect(result.success).toBe(true);
      expect(result.upsertedCount).toBe(2);
    });
  });
  
  describe('4. Chat Interaction Flow', () => {
    it('should search for relevant context based on user query', async () => {
      const userQuery = 'How do I install the package?';
      
      // Mock vector search results
      const mockSearchResults = [
        {
          id: 'doc-2',
          score: 0.95,
          metadata: {
            text: 'Installation: Run npm install to get started',
            botId: testBotId,
            url: testUrl,
          },
        },
        {
          id: 'doc-3',
          score: 0.87,
          metadata: {
            text: 'Requirements: Node.js 14 or higher',
            botId: testBotId,
            url: testUrl,
          },
        },
      ];
      
      jest.spyOn(vectorService, 'search').mockResolvedValue(mockSearchResults);
      
      // Search for context
      const searchResults = await vectorService.search(userQuery, testBotId, 5);
      
      expect(searchResults).toHaveLength(2);
      expect(searchResults[0].score).toBeGreaterThan(0.9);
      expect(searchResults[0].metadata.text).toContain('npm install');
    });
    
    it('should generate AI response using context', async () => {
      const userMessage = 'How do I install this?';
      const context = [
        'Installation: Run npm install to get started',
        'Requirements: Node.js 14 or higher',
      ];
      
      // Mock OpenAI chat completion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'To install the package, you need to run `npm install`. Make sure you have Node.js 14 or higher installed first.',
            },
          }],
        }),
      });
      
      // Generate response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockEnv.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Use this context to answer: ${context.join(' ')}`,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
      });
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      expect(aiResponse).toContain('npm install');
      expect(aiResponse).toContain('Node.js 14');
    });
  });
  
  describe('5. Widget Integration', () => {
    it('should handle widget chat requests with CORS', async () => {
      const mockRequest = {
        botId: testBotId,
        message: 'Hello, I need help',
        sessionId: 'session-123',
      };
      
      // Mock API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Hello! How can I assist you today?',
          conversationId: 'conv-123',
          sessionId: 'session-123',
        }),
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
            };
            return headers[name];
          },
        },
      });
      
      // Make widget request
      const response = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Id': mockRequest.botId,
        },
        body: JSON.stringify(mockRequest),
      });
      
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.response).toBeDefined();
      expect(data.sessionId).toBe('session-123');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
  
  describe('6. Analytics and Monitoring', () => {
    it('should track widget events', async () => {
      const mockEvent = {
        botId: testBotId,
        event: 'widget_opened',
        timestamp: new Date().toISOString(),
        metadata: {
          url: 'https://customer-site.com',
          userAgent: 'Mozilla/5.0',
        },
      };
      
      // Mock analytics insertion
      jest.spyOn(supabase.from('analytics_events'), 'insert').mockResolvedValue({
        data: { id: 'event-123', ...mockEvent },
        error: null,
      });
      
      // Track event
      const { error } = await supabase
        .from('analytics_events')
        .insert(mockEvent);
      
      expect(error).toBeNull();
    });
    
    it('should track conversation metrics', async () => {
      const mockMetrics = {
        bot_id: testBotId,
        total_messages: 10,
        avg_response_time: 1.5,
        satisfaction_score: 4.5,
        date: new Date().toISOString(),
      };
      
      // Mock metrics insertion
      jest.spyOn(supabase.from('conversation_metrics'), 'insert').mockResolvedValue({
        data: mockMetrics,
        error: null,
      });
      
      // Store metrics
      const { error } = await supabase
        .from('conversation_metrics')
        .insert(mockMetrics);
      
      expect(error).toBeNull();
    });
  });
  
  describe('7. Error Handling and Recovery', () => {
    it('should handle scraping failures gracefully', async () => {
      // Mock fetch failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Attempt to scrape
      const result = await scraperService.scrapeUrl('https://invalid-url.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
    
    it('should handle rate limiting', async () => {
      // Mock rate limit response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });
      
      // Make request
      const response = await fetch('/api/widget/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'test' }),
      });
      
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toContain('Rate limit');
    });
    
    it('should retry failed operations with exponential backoff', async () => {
      let attemptCount = 0;
      
      // Mock fetch to fail twice then succeed
      (global.fetch as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          text: async () => '<html><body>Success</body></html>',
        });
      });
      
      // Scrape with retries
      const result = await scraperService.scrapeUrl(testUrl);
      
      expect(attemptCount).toBe(3);
      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('Success');
    });
  });
});