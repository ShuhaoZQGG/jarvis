import 'openai/shims/node'
import 'openai/shims/node'
import OpenAI from 'openai'
import { VectorStore, QueryResult } from '../vectorstore/vectorstore'
import { EmbeddingsGenerator } from '../embeddings/embeddings'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  answer: string
  sources: QueryResult[]
}

export interface ChatOptions {
  history?: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface ChatServiceConfig {
  openaiApiKey: string
  vectorStore: VectorStore
  embeddingsGenerator: EmbeddingsGenerator
}

export class ChatService {
  private openai: OpenAI
  private vectorStore: VectorStore
  private embeddingsGenerator: EmbeddingsGenerator
  private model = 'gpt-4-turbo-preview'

  constructor(config: ChatServiceConfig) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey })
    this.vectorStore = config.vectorStore
    this.embeddingsGenerator = config.embeddingsGenerator
  }

  async chat(
    question: string,
    namespace: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    const embedding = await this.embeddingsGenerator.generateEmbedding(question)
    const context = await this.vectorStore.query(embedding, 5, namespace)

    const systemPrompt = this.buildSystemPrompt(context)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(options.history || []),
      { role: 'user', content: question },
    ]

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500,
    })

    return {
      answer: completion.choices[0].message.content || 'Sorry, I could not generate a response.',
      sources: context,
    }
  }

  async *streamChat(
    question: string,
    namespace: string,
    options: ChatOptions = {}
  ): AsyncGenerator<string> {
    const embedding = await this.embeddingsGenerator.generateEmbedding(question)
    const context = await this.vectorStore.query(embedding, 5, namespace)

    const systemPrompt = this.buildSystemPrompt(context)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(options.history || []),
      { role: 'user', content: question },
    ]

    const stream = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }

  private buildSystemPrompt(context: QueryResult[]): string {
    if (context.length === 0) {
      return `You are a helpful AI assistant. When you don't have enough context to answer a question, 
        please let the user know politely.`
    }

    const contextText = context
      .map(item => item.metadata?.content || '')
      .filter(content => content.length > 0)
      .join('\n\n')

    return `You are a helpful AI assistant. Use the following context to answer questions:

Context:
${contextText}

Instructions:
- Answer based on the provided context
- If the context doesn't contain enough information, say so
- Be concise and helpful
- Maintain a friendly, professional tone`
  }
}