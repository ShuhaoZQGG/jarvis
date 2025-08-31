import 'openai/shims/node';
import OpenAI from 'openai';
import { PineconeService } from '../vectors/pinecone';
import { EmbeddingService } from '../embeddings/embeddings';
import { v4 as uuidv4 } from 'uuid';

export interface RAGConfig {
  openaiApiKey: string;
  pineconeApiKey: string;
  pineconeEnvironment: string;
  pineconeIndexName: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface RAGDocument {
  content: string;
  metadata?: Record<string, any>;
}

export interface RAGQueryOptions {
  filter?: Record<string, any>;
  topK?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

interface CacheEntry {
  response: RAGResponse;
  timestamp: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class RAGEngine {
  private openai: OpenAI;
  private pinecone: PineconeService;
  private embeddings: EmbeddingService;
  private config: RAGConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private initialized = false;

  constructor(config: RAGConfig) {
    this.config = {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 500,
      topK: 5,
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      ...config,
    };

    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.pinecone = new PineconeService({
      apiKey: config.pineconeApiKey,
      environment: config.pineconeEnvironment,
      indexName: config.pineconeIndexName,
    });
    this.embeddings = new EmbeddingService({
      apiKey: config.openaiApiKey,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.pinecone.initialize();
    this.initialized = true;
  }

  async indexDocument(namespace: string, document: RAGDocument): Promise<void> {
    await this.ensureInitialized();

    // Chunk the document
    const chunks = this.embeddings.chunkText(
      document.content,
      512,
      document.metadata,
      50 // overlap
    );

    // Generate embeddings for chunks
    const documentEmbeddings = await this.embeddings.generateDocumentEmbeddings(
      chunks.map(chunk => ({
        text: chunk.text,
        metadata: chunk.metadata,
      }))
    );

    // Prepare vectors for Pinecone
    const vectors = documentEmbeddings.map((embedding, index) => ({
      id: `${uuidv4()}-${index}`,
      values: embedding.embedding,
      metadata: {
        text: embedding.text,
        ...embedding.metadata,
        chunkIndex: index,
      },
    }));

    // Store in Pinecone
    await this.pinecone.upsert(namespace, vectors);
  }

  async indexDocuments(namespace: string, documents: RAGDocument[]): Promise<void> {
    for (const document of documents) {
      await this.indexDocument(namespace, document);
    }
  }

  async query(
    namespace: string,
    query: string,
    options?: RAGQueryOptions
  ): Promise<RAGResponse> {
    await this.ensureInitialized();

    // Check cache
    const cacheKey = `${namespace}:${query}:${JSON.stringify(options || {})}`;
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddings.generateEmbedding(query);

      // Retrieve relevant context from Pinecone
      const contexts = await this.pinecone.query(
        namespace,
        queryEmbedding,
        options?.topK || this.config.topK,
        options?.filter
      );

      // Build context string
      const contextString = contexts
        .map(ctx => ctx.metadata?.text || '')
        .filter(Boolean)
        .join('\n\n');

      // Generate response using OpenAI
      const systemPrompt = `You are a helpful AI assistant. Answer the user's question based on the following context. If the context doesn't contain relevant information, say so politely.

Context:
${contextString || 'No relevant context found.'}`;

      const completion = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: options?.temperature || this.config.temperature,
        max_tokens: options?.maxTokens || this.config.maxTokens,
      });

      const response: RAGResponse = {
        answer: completion.choices[0]?.message?.content || 'Unable to generate response.',
        sources: contexts,
      };

      // Cache the response
      if (this.config.cacheEnabled) {
        this.addToCache(cacheKey, response);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Pinecone')) {
        throw new Error(`Failed to retrieve context: ${error.message}`);
      }
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  async queryStream(
    namespace: string,
    query: string,
    onChunk: (chunk: string) => void,
    options?: RAGQueryOptions
  ): Promise<void> {
    await this.ensureInitialized();

    // Generate query embedding
    const queryEmbedding = await this.embeddings.generateEmbedding(query);

    // Retrieve relevant context
    const contexts = await this.pinecone.query(
      namespace,
      queryEmbedding,
      options?.topK || this.config.topK,
      options?.filter
    );

    // Build context string
    const contextString = contexts
      .map(ctx => ctx.metadata?.text || '')
      .filter(Boolean)
      .join('\n\n');

    // Stream response from OpenAI
    const stream = await this.openai.chat.completions.create({
      model: this.config.model!,
      messages: [
        {
          role: 'system',
          content: `Answer based on this context: ${contextString || 'No context available.'}`,
        },
        { role: 'user', content: query },
      ],
      temperature: options?.temperature || this.config.temperature,
      max_tokens: options?.maxTokens || this.config.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
  }

  createConversation(namespace: string) {
    const history: ConversationMessage[] = [];

    return {
      send: async (message: string, options?: RAGQueryOptions): Promise<RAGResponse> => {
        history.push({ role: 'user', content: message });

        // Get context for the message
        const queryEmbedding = await this.embeddings.generateEmbedding(message);
        const contexts = await this.pinecone.query(
          namespace,
          queryEmbedding,
          options?.topK || this.config.topK,
          options?.filter
        );

        const contextString = contexts
          .map(ctx => ctx.metadata?.text || '')
          .filter(Boolean)
          .join('\n\n');

        // Build messages with history
        const messages: ConversationMessage[] = [
          {
            role: 'system',
            content: `You are a helpful AI assistant. Use the following context to answer questions: ${contextString}`,
          },
          ...history,
        ];

        const completion = await this.openai.chat.completions.create({
          model: this.config.model!,
          messages: messages as any,
          temperature: options?.temperature || this.config.temperature,
          max_tokens: options?.maxTokens || this.config.maxTokens,
        });

        const answer = completion.choices[0]?.message?.content || 'Unable to generate response.';
        history.push({ role: 'assistant', content: answer });

        return {
          answer,
          sources: contexts,
        };
      },

      getHistory: () => [...history],
      
      clear: () => {
        history.length = 0;
      },
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private getFromCache(key: string): RAGResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.config.cacheTTL!) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  private addToCache(key: string, response: RAGResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}