import { Pinecone } from '@pinecone-database/pinecone'

export interface VectorDocument {
  id: string
  embedding: number[]
  metadata?: Record<string, any>
}

export interface QueryResult {
  id: string
  score: number
  metadata?: Record<string, any>
}

export interface VectorStoreConfig {
  apiKey: string
  indexName: string
}

export class VectorStore {
  private pinecone: Pinecone
  private indexName: string
  private batchSize = 100

  constructor(config: VectorStoreConfig) {
    this.pinecone = new Pinecone({
      apiKey: config.apiKey,
    })
    this.indexName = config.indexName
  }

  async upsertDocument(doc: VectorDocument, namespace = 'default'): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName)
      await index.namespace(namespace).upsert([{
        id: doc.id,
        values: doc.embedding,
        metadata: doc.metadata,
      }])
    } catch (error) {
      throw new Error(`Failed to upsert document: ${error}`)
    }
  }

  async upsertBatch(docs: VectorDocument[], namespace = 'default'): Promise<void> {
    const index = this.pinecone.index(this.indexName)
    
    for (let i = 0; i < docs.length; i += this.batchSize) {
      const batch = docs.slice(i, i + this.batchSize)
      
      try {
        await index.namespace(namespace).upsert(
          batch.map(doc => ({
            id: doc.id,
            values: doc.embedding,
            metadata: doc.metadata,
          }))
        )
      } catch (error) {
        console.error(`Failed to upsert batch starting at index ${i}:`, error)
      }
    }
  }

  async query(
    embedding: number[],
    topK = 5,
    namespace = 'default',
    filter?: Record<string, any>
  ): Promise<QueryResult[]> {
    try {
      const index = this.pinecone.index(this.indexName)
      const queryResponse = await index.namespace(namespace).query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter,
      })

      return queryResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
      })) || []
    } catch (error) {
      throw new Error(`Failed to query: ${error}`)
    }
  }

  async deleteByNamespace(namespace: string): Promise<void> {
    const index = this.pinecone.index(this.indexName)
    await index.namespace(namespace).deleteMany({ deleteAll: true })
  }
}