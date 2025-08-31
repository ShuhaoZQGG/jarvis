/**
 * @jest-environment node
 */

import 'openai/shims/node'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { ChatService } from '@/lib/chat/chat'
import { EmbeddingsGenerator } from '@/lib/embeddings/embeddings'

// Mock dependencies
jest.mock('@/lib/vectorstore/vectorstore')
jest.mock('@/lib/chat/chat')
jest.mock('@/lib/embeddings/embeddings')
jest.mock('@/lib/ratelimit', () => ({
  rateLimitMiddleware: jest.fn(() => null),
  chatRateLimiter: {}
}))
jest.mock('@/lib/env', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    PINECONE_API_KEY: 'test-pinecone-key',
    PINECONE_INDEX_NAME: 'test-index',
  }
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'bots') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'test-bot-123', name: 'Test Bot', workspace_id: 'workspace-1' },
                error: null
              }))
            }))
          }))
        }
      } else if (table === 'conversations') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: null,
                  error: { code: 'PGRST116' }
                }))
              }))
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'conv-123' },
                error: null
              }))
            }))
          }))
        }
      } else if (table === 'messages') {
        return {
          insert: jest.fn(() => Promise.resolve({
            data: { id: 'msg-123' },
            error: null
          }))
        }
      }
      return {}
    })
  }
}))

describe('Chat API Route', () => {
  let mockVectorStore: jest.Mocked<VectorStore>
  let mockChatService: jest.Mocked<ChatService>
  let mockEmbeddingsGenerator: jest.Mocked<EmbeddingsGenerator>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockVectorStore = {
      query: jest.fn(),
    } as any
    
    mockChatService = {
      chat: jest.fn(),
    } as any

    mockEmbeddingsGenerator = {
      generateEmbedding: jest.fn(),
    } as any
    
    ;(VectorStore as jest.Mock).mockImplementation(() => mockVectorStore)
    ;(ChatService as jest.Mock).mockImplementation(() => mockChatService)
    ;(EmbeddingsGenerator as jest.Mock).mockImplementation(() => mockEmbeddingsGenerator)
  })

  it('should generate a chat response successfully', async () => {
    const mockResponse = {
      answer: 'Our product costs $99 and includes 24/7 support.',
      sources: [
        { id: 'doc-1', score: 0.9, metadata: { content: 'Our product costs $99' } },
        { id: 'doc-2', score: 0.85, metadata: { content: 'We offer 24/7 support' } },
      ]
    }
    
    mockChatService.chat.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        botId: 'test-bot-123',
        message: 'What is the price?',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Our product costs $99 and includes 24/7 support.')
    expect(data.sources).toEqual(mockResponse.sources)
    expect(data.sessionId).toBeDefined()
    expect(mockChatService.chat).toHaveBeenCalledWith(
      'What is the price?',
      'test-bot-123',
      { history: undefined }
    )
  })

  it('should handle missing botId', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What is the price?',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request')
  })

  it('should handle missing message', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        botId: 'test-bot-123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request')
  })

  it('should handle chat service errors gracefully', async () => {
    mockChatService.chat.mockRejectedValue(new Error('Chat service error'))

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        botId: 'test-bot-123',
        message: 'What is the price?',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat request')
  })

  it('should handle conversation history', async () => {
    const mockResponse = {
      answer: 'Based on our previous discussion...',
      sources: [{ id: 'doc-1', score: 0.9, metadata: { content: 'Product info' } }]
    }
    mockChatService.chat.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        botId: 'test-bot-123',
        message: 'Tell me more',
        history: [
          { role: 'user', content: 'What products do you offer?' },
          { role: 'assistant', content: 'We offer various products...' }
        ]
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Based on our previous discussion...')
    expect(mockChatService.chat).toHaveBeenCalledWith(
      'Tell me more',
      'test-bot-123',
      {
        history: [
          { role: 'user', content: 'What products do you offer?' },
          { role: 'assistant', content: 'We offer various products...' }
        ]
      }
    )
  })
})