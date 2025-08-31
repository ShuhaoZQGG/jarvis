import { PlaywrightScraper } from '../scraper/playwright-scraper';
import { EmbeddingService } from '../embeddings/embeddings';
import { VectorSearchService } from '../vector/vector-search';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface TrainingConfig {
  openaiApiKey: string;
  pineconeApiKey: string;
  pineconeIndexName: string;
  maxDepth?: number;
  maxPages?: number;
  chunkSize?: number;
  overlapTokens?: number;
}

export interface TrainingDocument {
  url: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface TrainingResult {
  documentsProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  errors: string[];
  duration: number;
}

export interface TrainingProgress {
  stage: 'scraping' | 'processing' | 'embedding' | 'indexing' | 'complete';
  current: number;
  total: number;
  message: string;
}

export class BotTrainingService {
  private scraper: PlaywrightScraper;
  private embeddingService: EmbeddingService;
  private vectorService: VectorSearchService;
  private config: TrainingConfig;

  constructor(config: TrainingConfig) {
    this.config = {
      maxDepth: 2,
      maxPages: 50,
      chunkSize: 512,
      overlapTokens: 50,
      ...config
    };

    this.scraper = new PlaywrightScraper();
    this.embeddingService = new EmbeddingService({ 
      apiKey: config.openaiApiKey 
    });
    this.vectorService = new VectorSearchService({
      apiKey: config.pineconeApiKey,
      indexName: config.pineconeIndexName
    });
    this.vectorService.setEmbeddingService(this.embeddingService);
  }

  async trainFromUrl(
    botId: string,
    url: string,
    onProgress?: (progress: TrainingProgress) => void
  ): Promise<TrainingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let documentsProcessed = 0;
    let chunksCreated = 0;
    let embeddingsGenerated = 0;

    try {
      await this.scraper.initialize();

      onProgress?.({
        stage: 'scraping',
        current: 0,
        total: this.config.maxPages!,
        message: `Starting web scraping from ${url}`
      });

      const scrapedPages = await this.scraper.scrapeWithLinks(
        url,
        this.config.maxDepth!,
        this.config.maxPages!
      );

      documentsProcessed = scrapedPages.length;

      onProgress?.({
        stage: 'processing',
        current: 0,
        total: documentsProcessed,
        message: 'Processing scraped content'
      });

      const allChunks: Array<{
        id: string;
        text: string;
        url: string;
        title: string;
        metadata: Record<string, any>;
      }> = [];

      for (let i = 0; i < scrapedPages.length; i++) {
        const page = scrapedPages[i];
        
        onProgress?.({
          stage: 'processing',
          current: i + 1,
          total: documentsProcessed,
          message: `Processing ${page.title}`
        });

        const cleanedContent = this.cleanContent(page.content);
        const contentHash = this.hashContent(cleanedContent);
        
        const chunks = this.embeddingService.chunkText(
          cleanedContent,
          this.config.chunkSize!,
          {
            url: page.url,
            title: page.title,
            timestamp: page.timestamp,
            contentHash
          },
          this.config.overlapTokens
        );

        chunks.forEach((chunk, index) => {
          allChunks.push({
            id: `${botId}_${contentHash}_chunk_${index}`,
            text: chunk.text,
            url: page.url,
            title: page.title,
            metadata: {
              ...chunk.metadata,
              botId,
              chunkIndex: index,
              totalChunks: chunks.length
            }
          });
        });

        chunksCreated += chunks.length;
      }

      onProgress?.({
        stage: 'embedding',
        current: 0,
        total: allChunks.length,
        message: 'Generating embeddings'
      });

      const batchSize = 10;
      for (let i = 0; i < allChunks.length; i += batchSize) {
        const batch = allChunks.slice(i, i + batchSize);
        
        onProgress?.({
          stage: 'embedding',
          current: Math.min(i + batchSize, allChunks.length),
          total: allChunks.length,
          message: `Generating embeddings (${Math.min(i + batchSize, allChunks.length)}/${allChunks.length})`
        });

        try {
          await this.vectorService.indexChunkedDocuments(
            batch,
            botId,
            this.config.chunkSize!
          );
          embeddingsGenerated += batch.length;
        } catch (error) {
          errors.push(`Failed to index batch starting at ${i}: ${error}`);
          console.error(error);
        }
      }

      onProgress?.({
        stage: 'complete',
        current: embeddingsGenerated,
        total: embeddingsGenerated,
        message: 'Training complete'
      });

      return {
        documentsProcessed,
        chunksCreated,
        embeddingsGenerated,
        errors,
        duration: Date.now() - startTime
      };
    } catch (error) {
      errors.push(`Training failed: ${error}`);
      throw error;
    } finally {
      await this.scraper.close();
    }
  }

  async trainFromUrls(
    botId: string,
    urls: string[],
    onProgress?: (progress: TrainingProgress) => void
  ): Promise<TrainingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalDocumentsProcessed = 0;
    let totalChunksCreated = 0;
    let totalEmbeddingsGenerated = 0;

    try {
      await this.scraper.initialize();

      onProgress?.({
        stage: 'scraping',
        current: 0,
        total: urls.length,
        message: 'Starting web scraping'
      });

      const scrapedPages = await this.scraper.scrapeMultipleUrls(urls, 3);
      totalDocumentsProcessed = scrapedPages.length;

      for (const page of scrapedPages) {
        try {
          const result = await this.processDocument(botId, {
            url: page.url,
            title: page.title,
            content: page.content,
            metadata: page.metadata
          });
          
          totalChunksCreated += result.chunksCreated;
          totalEmbeddingsGenerated += result.embeddingsGenerated;
        } catch (error) {
          errors.push(`Failed to process ${page.url}: ${error}`);
        }
      }

      onProgress?.({
        stage: 'complete',
        current: totalEmbeddingsGenerated,
        total: totalEmbeddingsGenerated,
        message: 'Training complete'
      });

      return {
        documentsProcessed: totalDocumentsProcessed,
        chunksCreated: totalChunksCreated,
        embeddingsGenerated: totalEmbeddingsGenerated,
        errors,
        duration: Date.now() - startTime
      };
    } finally {
      await this.scraper.close();
    }
  }

  async trainFromContent(
    botId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<TrainingResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.processDocument(botId, {
        url: metadata?.url || 'manual-content',
        title: metadata?.title || 'Manual Content',
        content,
        metadata
      });

      return {
        ...result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Failed to train from content: ${error}`);
    }
  }

  private async processDocument(
    botId: string,
    document: TrainingDocument
  ): Promise<TrainingResult> {
    const cleanedContent = this.cleanContent(document.content);
    const contentHash = this.hashContent(cleanedContent);
    
    const chunks = this.embeddingService.chunkText(
      cleanedContent,
      this.config.chunkSize!,
      {
        ...document.metadata,
        url: document.url,
        title: document.title,
        contentHash
      },
      this.config.overlapTokens
    );

    const documents = chunks.map((chunk, index) => ({
      id: `${botId}_${contentHash}_chunk_${index}`,
      text: chunk.text,
      url: document.url,
      metadata: {
        ...chunk.metadata,
        botId,
        chunkIndex: index,
        totalChunks: chunks.length
      }
    }));

    const result = await this.vectorService.indexChunkedDocuments(
      documents,
      botId,
      this.config.chunkSize!
    );

    return {
      documentsProcessed: 1,
      chunksCreated: chunks.length,
      embeddingsGenerated: result.upsertedCount,
      errors: [],
      duration: 0
    };
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private hashContent(content: string): string {
    return createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }

  async deleteTrainingData(botId: string): Promise<void> {
    await this.vectorService.deleteAll(botId);
  }

  async getTrainingStats(botId: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    lastUpdated?: Date;
  }> {
    // This would need to be implemented with actual database queries
    // For now, return placeholder data
    return {
      totalDocuments: 0,
      totalChunks: 0,
      lastUpdated: new Date()
    };
  }
}