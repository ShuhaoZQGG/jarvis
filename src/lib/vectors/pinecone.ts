import { Pinecone, Index, RecordMetadata } from '@pinecone-database/pinecone';

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: RecordMetadata;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata?: RecordMetadata;
}

export class PineconeService {
  private client: Pinecone | null = null;
  private index: Index | null = null;
  private config: PineconeConfig;
  private initialized = false;

  constructor(config: PineconeConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.client = new Pinecone({
        apiKey: this.config.apiKey,
      });

      // Check if index exists, create if not
      const indexList = await this.client.listIndexes();
      const indexExists = indexList.indexes?.some(
        (index: any) => index.name === this.config.indexName
      );

      if (!indexExists) {
        await this.client.createIndex({
          name: this.config.indexName,
          dimension: 1536, // OpenAI ada-002 embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });

        // Wait for index to be ready
        await this.waitForIndexReady();
      }

      this.index = this.client.index(this.config.indexName);
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Pinecone: ${error}`);
    }
  }

  private async waitForIndexReady(maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const indexList = await this.client!.listIndexes();
      const index = indexList.indexes?.find(
        (idx: any) => idx.name === this.config.indexName
      );

      if (index?.status?.ready) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Index creation timeout');
  }

  async upsert(namespace: string, vectors: VectorRecord[]): Promise<void> {
    await this.ensureInitialized();

    const ns = this.index!.namespace(namespace);
    
    // Batch upsert in chunks of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await ns.upsert(batch);
    }
  }

  async query(
    namespace: string,
    vector: number[],
    topK: number = 5,
    filter?: RecordMetadata
  ): Promise<QueryResult[]> {
    await this.ensureInitialized();

    const ns = this.index!.namespace(namespace);
    const queryRequest: any = {
      vector,
      topK,
      includeMetadata: true,
    };

    if (filter) {
      queryRequest.filter = filter;
    }

    const response = await ns.query(queryRequest);
    
    return (response.matches || []).map((match: any) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata,
    }));
  }

  async deleteVector(namespace: string, id: string): Promise<void> {
    await this.ensureInitialized();
    const ns = this.index!.namespace(namespace);
    await ns.deleteOne(id);
  }

  async deleteVectors(namespace: string, ids: string[]): Promise<void> {
    await this.ensureInitialized();
    const ns = this.index!.namespace(namespace);
    await ns.deleteMany(ids);
  }

  async deleteNamespace(namespace: string): Promise<void> {
    await this.ensureInitialized();
    const ns = this.index!.namespace(namespace);
    await ns.deleteAll();
  }

  async getStats(): Promise<any> {
    await this.ensureInitialized();
    return await this.index!.describeIndexStats();
  }

  namespace(name: string) {
    return {
      upsert: (vectors: VectorRecord[]) => this.upsert(name, vectors),
      query: (vector: number[], topK?: number, filter?: RecordMetadata) =>
        this.query(name, vector, topK, filter),
      delete: (id: string) => this.deleteVector(name, id),
      deleteMany: (ids: string[]) => this.deleteVectors(name, ids),
      deleteAll: () => this.deleteNamespace(name),
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async close(): Promise<void> {
    // Pinecone client doesn't require explicit closing
    this.client = null;
    this.index = null;
    this.initialized = false;
  }
}

// Factory function for creating Pinecone service from environment variables
export function createPineconeService(): PineconeService {
  const apiKey = process.env.PINECONE_API_KEY;
  const environment = process.env.PINECONE_ENVIRONMENT || 'production';
  const indexName = process.env.PINECONE_INDEX_NAME || 'jarvis-vectors';

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }

  return new PineconeService({
    apiKey,
    environment,
    indexName,
  });
}