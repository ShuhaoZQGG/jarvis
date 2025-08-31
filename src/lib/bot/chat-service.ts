import 'openai/shims/node';
import { EmbeddingService } from '../embeddings/embeddings';
import { VectorSearchService } from '../vector/vector-search';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

export interface ChatConfig {
  openaiApiKey: string;
  pineconeApiKey: string;
  pineconeIndexName: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  systemPrompt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  botId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  sources: Array<{
    text: string;
    url?: string;
    score: number;
  }>;
  sessionId: string;
  messageId: string;
}

export interface StreamChunkCallback {
  (chunk: string): void;
}

export class ChatService {
  private openai: OpenAI;
  private embeddingService: EmbeddingService;
  private vectorService: VectorSearchService;
  private config: ChatConfig;
  private sessions: Map<string, ChatSession> = new Map();

  constructor(config: ChatConfig) {
    this.config = {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 500,
      topK: 5,
      systemPrompt: 'You are a helpful AI assistant. Answer questions based on the provided context. If you cannot find relevant information in the context, say so politely.',
      ...config
    };

    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    
    this.embeddingService = new EmbeddingService({ 
      apiKey: config.openaiApiKey 
    });
    
    this.vectorService = new VectorSearchService({
      apiKey: config.pineconeApiKey,
      indexName: config.pineconeIndexName
    });
    this.vectorService.setEmbeddingService(this.embeddingService);
  }

  async createSession(botId: string, metadata?: Record<string, any>): Promise<string> {
    const sessionId = uuidv4();
    const session: ChatSession = {
      id: sessionId,
      botId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async sendMessage(
    sessionId: string,
    message: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topK?: number;
    }
  ): Promise<ChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    const searchResults = await this.vectorService.similaritySearch(
      message,
      options?.topK || this.config.topK,
      session.botId
    );

    const context = searchResults
      .map(result => result.text)
      .filter(Boolean)
      .join('\n\n');

    const systemMessage = `${this.config.systemPrompt}

Context:
${context || 'No relevant context found.'}

Please provide a helpful and accurate response based on the context above.`;

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...session.messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const completion = await this.openai.chat.completions.create({
      model: this.config.model!,
      messages,
      temperature: options?.temperature || this.config.temperature,
      max_tokens: options?.maxTokens || this.config.maxTokens
    });

    const assistantContent = completion.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response.';

    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
      metadata: {
        model: this.config.model,
        sources: searchResults.length
      }
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    return {
      message: assistantContent,
      sources: searchResults.map(result => ({
        text: result.text || '',
        url: result.metadata?.url,
        score: result.score
      })),
      sessionId,
      messageId: assistantMessage.id
    };
  }

  async streamMessage(
    sessionId: string,
    message: string,
    onChunk: StreamChunkCallback,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topK?: number;
    }
  ): Promise<ChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    const searchResults = await this.vectorService.similaritySearch(
      message,
      options?.topK || this.config.topK,
      session.botId
    );

    const context = searchResults
      .map(result => result.text)
      .filter(Boolean)
      .join('\n\n');

    const systemMessage = `${this.config.systemPrompt}

Context:
${context || 'No relevant context found.'}

Please provide a helpful and accurate response based on the context above.`;

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...session.messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const stream = await this.openai.chat.completions.create({
      model: this.config.model!,
      messages,
      temperature: options?.temperature || this.config.temperature,
      max_tokens: options?.maxTokens || this.config.maxTokens,
      stream: true
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    }

    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: fullContent,
      timestamp: new Date(),
      metadata: {
        model: this.config.model,
        sources: searchResults.length
      }
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    return {
      message: fullContent,
      sources: searchResults.map(result => ({
        text: result.text || '',
        url: result.metadata?.url,
        score: result.score
      })),
      sessionId,
      messageId: assistantMessage.id
    };
  }

  async getSession(sessionId: string): Promise<ChatSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return [...session.messages];
  }

  async clearSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    session.messages = [];
    session.updatedAt = new Date();
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async searchSimilarContent(
    botId: string,
    query: string,
    limit: number = 5
  ): Promise<Array<{ text: string; score: number; metadata?: any }>> {
    // Use botId as namespace for vector search
    const results = await this.vectorService.similaritySearch(query, limit, botId, undefined);
    // Filter out results without text and ensure text is not undefined
    return results
      .filter(r => r.text !== undefined)
      .map(r => ({
        text: r.text!,
        score: r.score,
        metadata: r.metadata
      }));
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}