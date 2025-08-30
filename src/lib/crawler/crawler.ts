import { chromium, Browser, Page } from 'playwright';
import { JSDOM } from 'jsdom';

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  useSitemap?: boolean;
  followExternalLinks?: boolean;
  userAgent?: string;
}

export interface PageContent {
  url: string;
  title: string;
  description: string;
  content: string;
  links: string[];
  timestamp: Date;
}

export interface CrawlResult {
  pages: PageContent[];
  metadata: {
    totalPages: number;
    crawlDuration: number;
    sitemapUsed?: boolean;
    errors?: string[];
  };
}

export interface Metadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  headings: string[];
}

export class WebsiteCrawler {
  private browser: Browser | null = null;
  private crawledUrls: Set<string> = new Set();
  private options: CrawlOptions = {
    maxDepth: 3,
    maxPages: 50,
    useSitemap: false,
    followExternalLinks: false,
    userAgent: 'JarvisBot/1.0',
  };

  constructor(options?: CrawlOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  async crawlPage(url: string): Promise<PageContent> {
    try {
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }

      const page = await this.browser.newPage();
      await page.setUserAgent(this.options.userAgent!);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');

        // Extract page content
        const pageData = await page.evaluate(() => {
          const getTextContent = (selector: string) => {
            const elements = document.querySelectorAll(selector);
            return Array.from(elements)
              .map(el => el.textContent?.trim())
              .filter(Boolean)
              .join(' ');
          };

          return {
            title: document.title || '',
            description: 
              (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || 
              (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content || 
              '',
            content: getTextContent('p, h1, h2, h3, h4, h5, h6, article, section, main'),
          };
        });

        // Extract links
        const links = await page.$$eval('a[href]', (anchors) =>
          anchors
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((href) => href && !href.startsWith('#') && !href.startsWith('javascript:'))
        );

        await page.close();

        return {
          url,
          title: pageData.title,
          description: pageData.description,
          content: pageData.content,
          links: this.filterLinks(links, url),
          timestamp: new Date(),
        };
      } catch (error) {
        await page.close();
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to crawl ${url}: ${error}`);
    }
  }

  async crawlWebsite(startUrl: string, options?: CrawlOptions): Promise<CrawlResult> {
    const crawlOptions = { ...this.options, ...options };
    const startTime = Date.now();
    const pages: PageContent[] = [];
    const errors: string[] = [];
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

    this.crawledUrls.clear();

    // Try to get sitemap first if enabled
    if (crawlOptions.useSitemap) {
      const sitemapUrls = await this.fetchSitemap(startUrl);
      if (sitemapUrls.length > 0) {
        queue.push(...sitemapUrls.slice(0, crawlOptions.maxPages).map(url => ({ url, depth: 0 })));
      }
    }

    while (queue.length > 0 && pages.length < crawlOptions.maxPages!) {
      const { url, depth } = queue.shift()!;

      if (this.crawledUrls.has(url) || depth > crawlOptions.maxDepth!) {
        continue;
      }

      try {
        const pageContent = await this.crawlPage(url);
        pages.push(pageContent);
        this.crawledUrls.add(url);

        // Add discovered links to queue
        if (depth < crawlOptions.maxDepth!) {
          const newLinks = pageContent.links
            .filter(link => !this.crawledUrls.has(link))
            .map(link => ({ url: link, depth: depth + 1 }));
          queue.push(...newLinks);
        }
      } catch (error) {
        errors.push(`${url}: ${error}`);
      }
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    return {
      pages,
      metadata: {
        totalPages: pages.length,
        crawlDuration: Date.now() - startTime,
        sitemapUsed: crawlOptions.useSitemap,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  private filterLinks(links: string[], baseUrl: string): string[] {
    const base = new URL(baseUrl);
    
    return links.filter(link => {
      try {
        const url = new URL(link, baseUrl);
        
        // Filter based on options
        if (!this.options.followExternalLinks && url.hostname !== base.hostname) {
          return false;
        }
        
        // Filter out common non-content URLs
        if (
          url.pathname.endsWith('.pdf') ||
          url.pathname.endsWith('.jpg') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.gif') ||
          url.pathname.endsWith('.zip')
        ) {
          return false;
        }
        
        return true;
      } catch {
        return false;
      }
    });
  }

  private async fetchSitemap(baseUrl: string): Promise<string[]> {
    try {
      const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
      
      if (!this.browser) {
        this.browser = await chromium.launch({ headless: true });
      }
      
      const page = await this.browser.newPage();
      await page.goto(sitemapUrl);
      
      const content = await page.content();
      await page.close();
      
      // Parse sitemap XML
      const dom = new JSDOM(content, { contentType: 'text/xml' });
      const urls = Array.from(dom.window.document.querySelectorAll('loc'))
        .map(loc => loc.textContent)
        .filter(Boolean) as string[];
      
      return urls;
    } catch {
      return [];
    }
  }

  async extractMetadata(html: string): Promise<Metadata> {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const title = doc.title || '';
    const description = 
      (doc.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || '';
    const ogTitle = 
      (doc.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content;
    const ogDescription = 
      (doc.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content;
    
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent?.trim())
      .filter(Boolean) as string[];

    return {
      title,
      description,
      ogTitle,
      ogDescription,
      headings,
    };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}