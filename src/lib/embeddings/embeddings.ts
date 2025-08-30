import 'openai/shims/node'
import OpenAI from 'openai'

export interface TextEmbedding {
  text: string
  embedding: number[]
}

export class EmbeddingsGenerator {
  private openai: OpenAI
  private model = 'text-embedding-ada-002'
  private maxBatchSize = 100

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      })

      return response.data[0].embedding
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`)
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<TextEmbedding[]> {
    const results: TextEmbedding[] = []
    
    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const batch = texts.slice(i, i + this.maxBatchSize)
      
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
        })

        batch.forEach((text, index) => {
          results.push({
            text,
            embedding: response.data[index].embedding,
          })
        })
      } catch (error) {
        console.error(`Failed to generate embeddings for batch starting at index ${i}:`, error)
      }
    }

    return results
  }

  chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxChunkSize) {
        currentChunk += sentence
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }
        currentChunk = sentence
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }
}