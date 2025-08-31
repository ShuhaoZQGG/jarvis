import { Pinecone, PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { EmbeddingService } from '../embeddings/embeddings';

export interface VectorSearchConfig {
  apiKey: string;
  environment?: string;
  indexName: string;
}

export interface QueryOptions {
  vector: number[];
  topK: number;
  namespace?: string;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
  includeValues?: boolean;
}

export interface SearchResult {
  id: string;
  score: number;
  text?: string;
  metadata?: Record<string, any>;
}

export interface UpsertResult {
  upsertedCount: number;
}

export class VectorSearchService {
  private pinecone: Pinecone;
  private indexName: string;
  private embeddingService?: EmbeddingService;
  private batchSize = 100;

  constructor(config: VectorSearchConfig) {
    this.pinecone = new Pinecone({
      apiKey: config.apiKey
    });
    this.indexName = config.indexName;
  }

  setEmbeddingService(service: EmbeddingService) {
    this.embeddingService = service;
  }

  async upsert(
    vectors: PineconeRecord[],
    namespace?: string
  ): Promise<UpsertResult> {
    const index = this.pinecone.index(this.indexName);
    const ns = namespace ? index.namespace(namespace) : index;
    
    const result = await ns.upsert(vectors);
    return { upsertedCount: result.upsertedCount || 0 };
  }

  async upsertBatch(
    vectors: PineconeRecord[],
    namespace?: string
  ): Promise<UpsertResult> {
    let totalUpserted = 0;
    
    for (let i = 0; i < vectors.length; i += this.batchSize) {
      const batch = vectors.slice(i, i + this.batchSize);
      const result = await this.upsert(batch, namespace);
      totalUpserted += result.upsertedCount;
    }
    
    return { upsertedCount: totalUpserted };
  }

  async query(options: QueryOptions) {
    const index = this.pinecone.index(this.indexName);
    const ns = options.namespace ? index.namespace(options.namespace) : index;
    
    const queryOptions: any = {
      vector: options.vector,
      topK: options.topK,
      includeMetadata: options.includeMetadata ?? true,
      includeValues: options.includeValues ?? false
    };
    
    if (options.filter) {
      queryOptions.filter = options.filter;
    }
    
    return await ns.query(queryOptions);
  }

  async deleteOne(id: string, namespace?: string): Promise<void> {
    const index = this.pinecone.index(this.indexName);
    const ns = namespace ? index.namespace(namespace) : index;
    await ns.deleteOne(id);
  }

  async deleteMany(ids: string[], namespace?: string): Promise<void> {
    const index = this.pinecone.index(this.indexName);
    const ns = namespace ? index.namespace(namespace) : index;
    await ns.deleteMany(ids);
  }

  async deleteAll(namespace?: string): Promise<void> {
    const index = this.pinecone.index(this.indexName);
    const ns = namespace ? index.namespace(namespace) : index;
    await ns.deleteAll();
  }

  async similaritySearch(
    query: string,
    topK: number = 5,
    namespace?: string,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    if (!this.embeddingService) {
      throw new Error('Embedding service not configured');
    }

    const queryEmbedding = await this.generateEmbedding(query);
    
    const results = await this.query({
      vector: queryEmbedding,
      topK,
      namespace,
      filter,
      includeMetadata: true
    });

    return results.matches.map(match => ({
      id: match.id,
      score: match.score,
      text: match.metadata?.text as string,
      metadata: match.metadata as Record<string, any>
    }));
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingService) {
      throw new Error('Embedding service not configured');
    }
    return this.embeddingService.generateEmbedding(text);
  }

  async indexDocuments(
    documents: Array<{
      id: string;
      text: string;
      metadata?: Record<string, any>;
    }>,
    namespace?: string
  ): Promise<UpsertResult> {
    if (!this.embeddingService) {
      throw new Error('Embedding service not configured');
    }

    const vectors: PineconeRecord[] = [];
    
    for (const doc of documents) {
      const embedding = await this.embeddingService.generateEmbedding(doc.text);
      
      vectors.push({
        id: doc.id,
        values: embedding,
        metadata: {
          text: doc.text,
          ...doc.metadata
        }
      });
    }

    return this.upsertBatch(vectors, namespace);
  }

  async indexChunkedDocuments(
    documents: Array<{
      id: string;
      text: string;
      url?: string;
      metadata?: Record<string, any>;
    }>,
    namespace?: string,
    chunkSize: number = 512
  ): Promise<UpsertResult> {
    if (!this.embeddingService) {
      throw new Error('Embedding service not configured');
    }

    const vectors: PineconeRecord[] = [];
    
    for (const doc of documents) {
      const chunks = this.embeddingService.chunkText(doc.text, chunkSize);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.embeddingService.generateEmbedding(chunk.text);
        
        vectors.push({
          id: `${doc.id}_chunk_${i}`,
          values: embedding,
          metadata: {
            text: chunk.text,
            documentId: doc.id,
            chunkIndex: i,
            url: doc.url,
            ...doc.metadata,
            ...chunk.metadata
          }
        });
      }
    }

    return this.upsertBatch(vectors, namespace);
  }
}