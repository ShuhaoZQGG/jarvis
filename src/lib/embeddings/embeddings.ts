import 'openai/shims/node'
import OpenAI from 'openai'

export interface EmbeddingConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface TextChunk {
  text: string;
  metadata?: Record<string, any>;
  index?: number;
}

export interface Document {
  text: string;
  metadata?: Record<string, any>;
}

export interface DocumentEmbedding {
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface TokenUsage {
  totalTokens: number;
  totalCost: number;
}

export class EmbeddingService {
  private openai: OpenAI;
  private model: string;
  private maxBatchSize = 100;
  private maxRetries: number;
  private retryDelay: number;
  private tokenUsage: TokenUsage = { totalTokens: 0, totalCost: 0 };
  private costPerToken = 0.0000001; // Ada-002 pricing

  constructor(config: EmbeddingConfig) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model || 'text-embedding-ada-002';
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Truncate text if too long (8191 tokens max for ada-002)
    const truncatedText = this.truncateText(text, 8000);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: truncatedText,
        });

        if (response.usage) {
          this.tokenUsage.totalTokens += response.usage.total_tokens;
          this.tokenUsage.totalCost += response.usage.total_tokens * this.costPerToken;
        }

        return response.data[0].embedding;
      } catch (error: any) {
        if (attempt === this.maxRetries - 1) {
          throw new Error(`Failed to generate embedding after ${this.maxRetries} attempts: ${error}`);
        }
        
        // Exponential backoff for rate limits
        if (error.message?.includes('Rate limit')) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        } else {
          throw new Error(`Failed to generate embedding: ${error}`);
        }
      }
    }

    throw new Error('Failed to generate embedding');
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const filteredTexts = texts.filter(text => text && text.trim().length > 0);
    if (filteredTexts.length === 0) {
      return [];
    }

    const results: number[][] = [];
    
    for (let i = 0; i < filteredTexts.length; i += this.maxBatchSize) {
      const batch = filteredTexts.slice(i, i + this.maxBatchSize);
      
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          const response = await this.openai.embeddings.create({
            model: this.model,
            input: batch,
          });

          if (response.usage) {
            this.tokenUsage.totalTokens += response.usage.total_tokens;
            this.tokenUsage.totalCost += response.usage.total_tokens * this.costPerToken;
          }

          results.push(...response.data.map(d => d.embedding));
          break;
        } catch (error: any) {
          if (attempt === this.maxRetries - 1) {
            console.error(`Failed to generate embeddings for batch starting at index ${i}:`, error);
          } else if (error.message?.includes('Rate limit')) {
            await this.delay(this.retryDelay * Math.pow(2, attempt));
          }
        }
      }
    }

    return results;
  }

  async generateDocumentEmbeddings(documents: Document[]): Promise<DocumentEmbedding[]> {
    const texts = documents.map(doc => doc.text);
    const embeddings = await this.generateBatchEmbeddings(texts);
    
    return documents.map((doc, index) => ({
      text: doc.text,
      embedding: embeddings[index],
      metadata: doc.metadata,
    }));
  }

  chunkText(
    text: string,
    maxTokens: number = 512,
    metadata?: Record<string, any>,
    overlapTokens: number = 0
  ): TextChunk[] {
    // Approximate 4 chars per token
    const maxChars = maxTokens * 4;
    const overlapChars = overlapTokens * 4;
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      if ((currentChunk + sentence).length <= maxChars) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push({
            text: currentChunk.trim(),
            metadata,
            index: chunkIndex++,
          });
        }
        
        // Add overlap from previous chunk
        if (overlapChars > 0 && currentChunk) {
          const words = currentChunk.split(' ');
          const overlapWords = words.slice(-Math.floor(overlapTokens)).join(' ');
          currentChunk = overlapWords + ' ' + sentence;
        } else {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        metadata,
        index: chunkIndex,
      });
    }

    return chunks;
  }

  private truncateText(text: string, maxTokens: number): string {
    // Approximate 4 chars per token
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) {
      return text;
    }
    return text.substring(0, maxChars);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  getEstimatedCost(): number {
    return this.tokenUsage.totalCost;
  }

  resetUsageStats(): void {
    this.tokenUsage = { totalTokens: 0, totalCost: 0 };
  }
}

// Legacy support - keep the old class name as alias
export class EmbeddingsGenerator extends EmbeddingService {
  constructor(apiKey: string) {
    super({ apiKey });
  }
}

export interface TextEmbedding {
  text: string
  embedding: number[]
}