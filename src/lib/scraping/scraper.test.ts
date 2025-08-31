import { WebScraper } from './scraper';

describe('WebScraper', () => {
  let scraper: WebScraper;

  beforeEach(() => {
    scraper = new WebScraper();
  });

  describe('scrapeUrl', () => {
    it('should scrape text content from a URL', async () => {
      const url = 'https://example.com';
      const mockContent = {
        title: 'Example Domain',
        content: 'This domain is for use in illustrative examples in documents.',
        url: url,
        metadata: {
          description: 'Example domain for documentation',
          keywords: []
        }
      };

      // Mock fetch response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(`
          <html>
            <head>
              <title>Example Domain</title>
              <meta name="description" content="Example domain for documentation">
            </head>
            <body>
              <p>This domain is for use in illustrative examples in documents.</p>
            </body>
          </html>
        `)
      } as any);

      const result = await scraper.scrapeUrl(url);
      expect(result.title).toBe(mockContent.title);
      expect(result.content).toContain('This domain is for use');
      expect(result.url).toBe(url);
    });

    it('should handle scraping errors gracefully', async () => {
      const url = 'https://invalid-url.com';
      
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(scraper.scrapeUrl(url)).rejects.toThrow('Failed to scrape URL');
    });

    it('should extract multiple page sections', async () => {
      const url = 'https://docs.example.com';
      
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(`
          <html>
            <body>
              <h1>Getting Started</h1>
              <p>Welcome to our documentation.</p>
              <h2>Installation</h2>
              <p>Run npm install to get started.</p>
              <h2>Configuration</h2>
              <p>Configure your settings in config.json.</p>
            </body>
          </html>
        `)
      } as any);

      const result = await scraper.scrapeUrl(url);
      expect(result.sections).toHaveLength(3);
      expect(result.sections[0].heading).toBe('Getting Started');
      expect(result.sections[1].heading).toBe('Installation');
      expect(result.sections[2].heading).toBe('Configuration');
    });
  });

  describe('scrapeMultipleUrls', () => {
    it('should scrape multiple URLs in parallel', async () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3'
      ];

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce('<html><body>Page 1</body></html>')
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce('<html><body>Page 2</body></html>')
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce('<html><body>Page 3</body></html>')
        } as any);

      const results = await scraper.scrapeMultipleUrls(urls);
      expect(results).toHaveLength(3);
      expect(results[0].content).toContain('Page 1');
      expect(results[1].content).toContain('Page 2');
      expect(results[2].content).toContain('Page 3');
    });

    it('should continue scraping even if one URL fails', async () => {
      const urls = [
        'https://example.com/page1',
        'https://invalid-url.com',
        'https://example.com/page3'
      ];

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce('<html><body>Page 1</body></html>')
        } as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce('<html><body>Page 3</body></html>')
        } as any);

      const results = await scraper.scrapeMultipleUrls(urls);
      expect(results).toHaveLength(2);
      expect(results[0].content).toContain('Page 1');
      expect(results[1].content).toContain('Page 3');
    });
  });

  describe('chunkContent', () => {
    it('should chunk large content into smaller pieces', () => {
      const largeContent = 'Lorem ipsum '.repeat(500);
      const chunks = scraper.chunkContent(largeContent, 500);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeLessThanOrEqual(500);
        expect(chunk.index).toBeGreaterThanOrEqual(0);
      });
    });

    it('should preserve context overlap between chunks', () => {
      const content = 'Sentence one. Sentence two. Sentence three. Sentence four.';
      const chunks = scraper.chunkContent(content, 30, 10);
      
      expect(chunks.length).toBeGreaterThan(1);
      // Check that there's overlap between consecutive chunks
      if (chunks.length > 1) {
        const firstChunkEnd = chunks[0].content.slice(-10);
        const secondChunkStart = chunks[1].content.slice(0, 10);
        expect(chunks[1].content).toContain(firstChunkEnd.split(' ').pop() || '');
      }
    });
  });
});