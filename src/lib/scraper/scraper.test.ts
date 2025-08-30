import { WebScraper } from './scraper'

describe('WebScraper', () => {
  let scraper: WebScraper

  beforeEach(() => {
    scraper = new WebScraper()
  })

  describe('scrapeUrl', () => {
    it('should scrape content from a valid URL', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Welcome to Test Site</h1>
            <p>This is a test paragraph with some content.</p>
            <nav>Navigation menu</nav>
            <footer>Footer content</footer>
          </body>
        </html>
      `

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      } as Response)

      const result = await scraper.scrapeUrl('https://example.com')

      expect(result).toHaveProperty('url', 'https://example.com')
      expect(result).toHaveProperty('title', 'Test Page')
      expect(result).toHaveProperty('content')
      expect(result.content).toContain('Welcome to Test Site')
      expect(result.content).toContain('This is a test paragraph')
      expect(result.content).not.toContain('Navigation menu')
      expect(result.content).not.toContain('Footer content')
    })

    it('should throw error for invalid URL', async () => {
      await expect(scraper.scrapeUrl('invalid-url')).rejects.toThrow('Invalid URL')
    })

    it('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      await expect(scraper.scrapeUrl('https://example.com')).rejects.toThrow('Failed to fetch')
    })
  })

  describe('scrapeMultipleUrls', () => {
    it('should scrape multiple URLs concurrently', async () => {
      const mockHtml = (title: string) => `
        <html>
          <head><title>${title}</title></head>
          <body><p>Content for ${title}</p></body>
        </html>
      `

      let callCount = 0
      global.fetch = jest.fn().mockImplementation((url) => {
        callCount++
        const title = `Page ${callCount}`
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockHtml(title)),
        } as Response)
      })

      const urls = ['https://example1.com', 'https://example2.com', 'https://example3.com']
      const results = await scraper.scrapeMultipleUrls(urls)

      expect(results).toHaveLength(3)
      expect(results[0].title).toBe('Page 1')
      expect(results[1].title).toBe('Page 2')
      expect(results[2].title).toBe('Page 3')
    })

    it('should handle partial failures in batch scraping', async () => {
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === 'https://fail.com') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<html><head><title>Success</title></head><body>Content</body></html>'),
        } as Response)
      })

      const urls = ['https://success1.com', 'https://fail.com', 'https://success2.com']
      const results = await scraper.scrapeMultipleUrls(urls)

      expect(results).toHaveLength(2)
      expect(results[0].url).toBe('https://success1.com')
      expect(results[1].url).toBe('https://success2.com')
    })
  })

  describe('extractMetadata', () => {
    it('should extract metadata from HTML', () => {
      const { JSDOM } = require('jsdom')
      const html = `
        <html>
          <head>
            <title>Test Title</title>
            <meta name="description" content="Test description">
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
          </head>
          <body>Content</body>
        </html>
      `

      const dom = new JSDOM(html)
      const metadata = scraper.extractMetadata(dom.window.document)

      expect(metadata).toEqual({
        title: 'Test Title',
        description: 'Test description',
        ogTitle: 'OG Title',
        ogDescription: 'OG Description',
      })
    })
  })
})