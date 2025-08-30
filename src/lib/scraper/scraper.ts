import { JSDOM } from 'jsdom'

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
      
      const dom = new JSDOM(html)
      const document = dom.window.document
      
      // Remove excluded tags
      this.excludeTags.forEach(tag => {
        const elements = document.querySelectorAll(tag)
        elements.forEach(el => el.remove())
      })
      
      const title = document.querySelector('title')?.textContent?.trim() || 'Untitled'
      const bodyText = document.body?.textContent?.replace(/\s+/g, ' ').trim() || ''
      const metadata = this.extractMetadata(document)
      
      return {
        url,
        title,
        content: bodyText,
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

  extractMetadata(document: Document): PageMetadata {
    return {
      title: document.querySelector('title')?.textContent?.trim() || undefined,
      description: (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || undefined,
      ogTitle: (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content || undefined,
      ogDescription: (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content || undefined,
    }
  }
}