const cheerio = require('cheerio');

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  sections: Section[];
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishedDate?: string;
  };
}

export interface Section {
  heading: string;
  content: string;
  level: number;
}

export interface ContentChunk {
  content: string;
  index: number;
  metadata?: {
    url?: string;
    section?: string;
  };
}

export class WebScraper {
  private readonly maxRetries = 3;
  private readonly timeout = 30000;

  async scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JarvisBot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.parseHtml(html, url);
    } catch (error) {
      throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scrapeMultipleUrls(urls: string[]): Promise<ScrapedContent[]> {
    const promises = urls.map(url => 
      this.scrapeUrl(url).catch(error => {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter((result): result is ScrapedContent => result !== null);
  }

  private parseHtml(html: string, url: string): ScrapedContent {
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, noscript').remove();

    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled';

    // Extract metadata
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    
    const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map((k: string) => k.trim()) || [];
    const author = $('meta[name="author"]').attr('content') || '';
    const publishedDate = $('meta[property="article:published_time"]').attr('content') || '';

    // Extract sections
    const sections: Section[] = [];
    const headings = $('h1, h2, h3, h4, h5, h6');

    headings.each((_: number, element: any) => {
      const $heading = $(element);
      const level = parseInt(element.tagName.substring(1));
      const headingText = $heading.text().trim();
      
      // Get content between this heading and the next
      let content = '';
      let $current = $heading.next();
      
      while ($current.length && !$current.is('h1, h2, h3, h4, h5, h6')) {
        content += $current.text().trim() + ' ';
        $current = $current.next();
      }

      if (headingText) {
        sections.push({
          heading: headingText,
          content: content.trim(),
          level
        });
      }
    });

    // Extract main content
    // Priority: article > main > body
    let mainContent = $('article').text().trim() ||
                     $('main').text().trim() ||
                     $('body').text().trim();

    // Clean up whitespace
    mainContent = mainContent.replace(/\s+/g, ' ').trim();

    return {
      title,
      content: mainContent,
      url,
      sections,
      metadata: {
        description,
        keywords,
        author,
        publishedDate
      }
    };
  }

  chunkContent(content: string, maxChunkSize = 1000, overlap = 100): ContentChunk[] {
    const chunks: ContentChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      let endIndex = Math.min(startIndex + maxChunkSize, content.length);
      
      // Try to break at sentence boundary
      if (endIndex < content.length) {
        const lastPeriod = content.lastIndexOf('.', endIndex);
        const lastNewline = content.lastIndexOf('\n', endIndex);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > startIndex + maxChunkSize / 2) {
          endIndex = breakPoint + 1;
        }
      }

      chunks.push({
        content: content.slice(startIndex, endIndex),
        index: chunkIndex++
      });

      // Move start index with overlap
      startIndex = endIndex - overlap;
      if (startIndex < 0) startIndex = 0;
    }

    return chunks;
  }

  async scrapeWithRetry(url: string, retries = this.maxRetries): Promise<ScrapedContent> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.scrapeUrl(url);
      } catch (error) {
        if (attempt === retries) throw error;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Max retries reached');
  }
}