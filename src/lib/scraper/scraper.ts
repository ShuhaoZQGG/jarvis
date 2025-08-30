import * as cheerio from 'cheerio'

export interface ScrapedPage {
  url: string
  title: string
  content: string
  metadata?: PageMetadata
  timestamp: Date
}

export interface PageMetadata {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
}

export class WebScraper {
  private readonly excludeTags = ['script', 'style', 'nav', 'footer', 'header', 'aside']

  async scrapeUrl(url: string): Promise<ScrapedPage> {
    try {
      new URL(url)
    } catch {
      throw new Error('Invalid URL')
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const html = await response.text()
      
      const $ = cheerio.load(html)
      
      this.excludeTags.forEach(tag => {
        $(tag).remove()
      })
      
      const title = $('title').text().trim() || 'Untitled'
      const content = $('body').text().replace(/\s+/g, ' ').trim()
      const metadata = this.extractMetadata(html)
      
      return {
        url,
        title,
        content,
        metadata,
        timestamp: new Date(),
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch: ${error.message}`)
      }
      throw new Error('Failed to fetch')
    }
  }

  async scrapeMultipleUrls(urls: string[]): Promise<ScrapedPage[]> {
    const promises = urls.map(url => 
      this.scrapeUrl(url).catch(error => {
        console.error(`Failed to scrape ${url}:`, error)
        return null
      })
    )
    
    const results = await Promise.all(promises)
    return results.filter((result): result is ScrapedPage => result !== null)
  }

  extractMetadata(html: string): PageMetadata {
    const $ = cheerio.load(html)
    
    return {
      title: $('title').text().trim() || undefined,
      description: $('meta[name="description"]').attr('content') || undefined,
      ogTitle: $('meta[property="og:title"]').attr('content') || undefined,
      ogDescription: $('meta[property="og:description"]').attr('content') || undefined,
    }
  }
}