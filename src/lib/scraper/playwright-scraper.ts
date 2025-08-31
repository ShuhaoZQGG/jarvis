import { chromium, Browser, Page } from 'playwright'
import { ScrapedPage, PageMetadata } from './scraper'

export class PlaywrightScraper {
  private browser: Browser | null = null
  private readonly excludeTags = ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript']

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async scrapeUrl(url: string): Promise<ScrapedPage> {
    try {
      new URL(url)
    } catch {
      throw new Error('Invalid URL')
    }

    await this.initialize()
    
    const page = await this.browser!.newPage()
    
    try {
      // Set a reasonable timeout
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Wait for content to load
      await page.waitForLoadState('domcontentloaded')
      
      // Extract title
      const title = await page.title() || 'Untitled'
      
      // Extract metadata
      const metadata = await this.extractMetadata(page)
      
      // Remove excluded elements and extract text content
      const content = await page.evaluate((excludeTags) => {
        // Remove excluded tags
        excludeTags.forEach((tag: string) => {
          const elements = document.querySelectorAll(tag)
          elements.forEach(el => el.remove())
        })
        
        // Get text content
        const bodyText = document.body?.innerText || ''
        return bodyText.replace(/\s+/g, ' ').trim()
      }, this.excludeTags)
      
      return {
        url,
        title,
        content,
        metadata,
        timestamp: new Date()
      }
    } finally {
      await page.close()
    }
  }

  async scrapeMultipleUrls(urls: string[], maxConcurrency = 3): Promise<ScrapedPage[]> {
    await this.initialize()
    
    const results: ScrapedPage[] = []
    const chunks: string[][] = []
    
    // Split URLs into chunks for concurrent processing
    for (let i = 0; i < urls.length; i += maxConcurrency) {
      chunks.push(urls.slice(i, i + maxConcurrency))
    }
    
    // Process chunks sequentially, URLs within chunks concurrently
    for (const chunk of chunks) {
      const promises = chunk.map(url => 
        this.scrapeUrl(url).catch(error => {
          console.error(`Failed to scrape ${url}:`, error)
          return null
        })
      )
      
      const chunkResults = await Promise.all(promises)
      results.push(...chunkResults.filter((result): result is ScrapedPage => result !== null))
    }
    
    return results
  }

  async scrapeSitemap(sitemapUrl: string, maxPages = 50): Promise<ScrapedPage[]> {
    await this.initialize()
    
    const page = await this.browser!.newPage()
    
    try {
      await page.goto(sitemapUrl, { waitUntil: 'networkidle' })
      
      // Extract URLs from sitemap
      const urls = await page.evaluate(() => {
        const urlElements = document.querySelectorAll('loc')
        return Array.from(urlElements).map(el => el.textContent).filter(Boolean) as string[]
      })
      
      await page.close()
      
      // Limit to maxPages
      const urlsToScrape = urls.slice(0, maxPages)
      
      return await this.scrapeMultipleUrls(urlsToScrape)
    } catch (error) {
      await page.close()
      throw error
    }
  }

  async scrapeWithLinks(url: string, maxDepth = 2, maxPages = 50): Promise<ScrapedPage[]> {
    await this.initialize()
    
    const visited = new Set<string>()
    const toVisit = [{ url, depth: 0 }]
    const results: ScrapedPage[] = []
    const baseUrl = new URL(url)
    
    while (toVisit.length > 0 && results.length < maxPages) {
      const current = toVisit.shift()
      if (!current || visited.has(current.url) || current.depth > maxDepth) {
        continue
      }
      
      visited.add(current.url)
      
      const page = await this.browser!.newPage()
      
      try {
        await page.goto(current.url, { waitUntil: 'networkidle', timeout: 30000 })
        
        // Extract content
        const scrapedPage = await this.scrapeUrl(current.url)
        results.push(scrapedPage)
        
        // Extract links if not at max depth
        if (current.depth < maxDepth) {
          const links = await page.evaluate((baseHost) => {
            const anchors = document.querySelectorAll('a[href]')
            return Array.from(anchors)
              .map(a => (a as HTMLAnchorElement).href)
              .filter(href => {
                try {
                  const url = new URL(href)
                  return url.host === baseHost
                } catch {
                  return false
                }
              })
          }, baseUrl.host)
          
          // Add new links to visit
          links.forEach(link => {
            if (!visited.has(link)) {
              toVisit.push({ url: link, depth: current.depth + 1 })
            }
          })
        }
      } catch (error) {
        console.error(`Failed to scrape ${current.url}:`, error)
      } finally {
        await page.close()
      }
    }
    
    return results
  }

  private async extractMetadata(page: Page): Promise<PageMetadata> {
    return await page.evaluate(() => {
      const getMetaContent = (selector: string): string | undefined => {
        const element = document.querySelector(selector) as HTMLMetaElement
        return element?.content || undefined
      }
      
      return {
        title: document.title || undefined,
        description: getMetaContent('meta[name="description"]'),
        ogTitle: getMetaContent('meta[property="og:title"]'),
        ogDescription: getMetaContent('meta[property="og:description"]'),
      }
    })
  }
}