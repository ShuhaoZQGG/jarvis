import { WebsiteCrawler } from './crawler';
import { Page } from 'playwright';

// Mock playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        goto: jest.fn(),
        evaluate: jest.fn(),
        close: jest.fn(),
        waitForLoadState: jest.fn(),
        $$eval: jest.fn(),
      }),
      close: jest.fn(),
    }),
  },
}));

describe('WebsiteCrawler', () => {
  let crawler: WebsiteCrawler;
  let mockPage: any;

  beforeEach(() => {
    crawler = new WebsiteCrawler();
    mockPage = {
      goto: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn(),
      waitForLoadState: jest.fn(),
      $$eval: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crawlPage', () => {
    it('should crawl a single page and extract content', async () => {
      const url = 'https://example.com';
      const mockContent = {
        title: 'Example Page',
        description: 'Test description',
        content: 'Page content here',
        links: ['https://example.com/page1', 'https://example.com/page2'],
      };

      mockPage.evaluate.mockResolvedValue(mockContent);
      mockPage.$$eval.mockResolvedValue(mockContent.links);

      const result = await crawler.crawlPage(url);

      expect(result).toEqual({
        url,
        title: mockContent.title,
        description: mockContent.description,
        content: mockContent.content,
        links: mockContent.links,
        timestamp: expect.any(Date),
      });
    });

    it('should handle crawl errors gracefully', async () => {
      const url = 'https://invalid-url.com';
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(crawler.crawlPage(url)).rejects.toThrow('Failed to crawl');
    });

    it('should respect maxDepth parameter', async () => {
      const url = 'https://example.com';
      const mockContent = {
        title: 'Root Page',
        description: 'Root description',
        content: 'Root content',
        links: ['https://example.com/page1'],
      };

      mockPage.evaluate.mockResolvedValue(mockContent);
      mockPage.$$eval.mockResolvedValue(mockContent.links);

      const results = await crawler.crawlWebsite(url, { maxDepth: 1 });

      expect(results.pages).toHaveLength(1);
      expect(results.pages[0].url).toBe(url);
    });

    it('should respect maxPages parameter', async () => {
      const url = 'https://example.com';
      const mockContent = {
        title: 'Page',
        description: 'Description',
        content: 'Content',
        links: [
          'https://example.com/page1',
          'https://example.com/page2',
          'https://example.com/page3',
        ],
      };

      mockPage.evaluate.mockResolvedValue(mockContent);
      mockPage.$$eval.mockResolvedValue(mockContent.links);

      const results = await crawler.crawlWebsite(url, { maxPages: 2 });

      expect(results.pages.length).toBeLessThanOrEqual(2);
    });
  });

  describe('crawlWebsite', () => {
    it('should crawl multiple pages from a website', async () => {
      const startUrl = 'https://example.com';
      const mockPages = [
        {
          url: startUrl,
          title: 'Home',
          description: 'Home page',
          content: 'Home content',
          links: ['https://example.com/about'],
        },
        {
          url: 'https://example.com/about',
          title: 'About',
          description: 'About page',
          content: 'About content',
          links: [],
        },
      ];

      mockPage.evaluate
        .mockResolvedValueOnce(mockPages[0])
        .mockResolvedValueOnce(mockPages[1]);
      mockPage.$$eval
        .mockResolvedValueOnce(mockPages[0].links)
        .mockResolvedValueOnce(mockPages[1].links);

      const results = await crawler.crawlWebsite(startUrl);

      expect(results.pages).toHaveLength(2);
      expect(results.pages[0].url).toBe(startUrl);
      expect(results.pages[1].url).toBe('https://example.com/about');
      expect(results.metadata.totalPages).toBe(2);
    });

    it('should filter out external links', async () => {
      const url = 'https://example.com';
      const mockContent = {
        title: 'Page',
        description: 'Description',
        content: 'Content',
        links: [
          'https://example.com/internal',
          'https://external.com/page',
          'https://another-site.com',
        ],
      };

      mockPage.evaluate.mockResolvedValue(mockContent);
      mockPage.$$eval.mockResolvedValue(mockContent.links);

      const results = await crawler.crawlWebsite(url);

      const crawledUrls = results.pages.map(p => p.url);
      expect(crawledUrls).not.toContain('https://external.com/page');
      expect(crawledUrls).not.toContain('https://another-site.com');
    });

    it('should handle sitemap if available', async () => {
      const url = 'https://example.com';
      const sitemapUrls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3',
      ];

      mockPage.goto.mockResolvedValue();
      mockPage.evaluate.mockResolvedValue({
        title: 'Page',
        description: 'Description',
        content: 'Content',
        links: [],
      });

      const results = await crawler.crawlWebsite(url, { useSitemap: true });

      expect(results.metadata.sitemapUsed).toBeDefined();
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from HTML', async () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
          </head>
          <body>
            <h1>Main Heading</h1>
            <p>Paragraph content</p>
          </body>
        </html>
      `;

      const metadata = await crawler.extractMetadata(html);

      expect(metadata).toEqual({
        title: 'Test Page',
        description: 'Test description',
        ogTitle: 'OG Title',
        ogDescription: 'OG Description',
        headings: ['Main Heading'],
      });
    });
  });
});