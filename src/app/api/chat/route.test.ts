import { POST } from './route'
import { NextRequest } from 'next/server'
import { VectorStore } from '@/lib/vectorstore/vectorstore'
import { ChatService } from '@/lib/chat/chat'

// Mock dependencies
jest.mock('@/lib/vectorstore/vectorstore')
jest.mock('@/lib/chat/chat')
jest.mock('@/lib/env', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    PINECONE_API_KEY: 'test-pinecone-key',
    PINECONE_INDEX_NAME: 'test-index',
  }
}))

describe('Chat API Route', () => {
  let mockVectorStore: jest.Mocked<VectorStore>
  let mockChatService: jest.Mocked<ChatService>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockVectorStore = {
      similaritySearch: jest.fn(),
    } as any
    
    mockChatService = {
      generateResponse: jest.fn(),
    } as any
    
    ;(VectorStore as jest.Mock).mockImplementation(() => mockVectorStore)
    ;(ChatService as jest.Mock).mockImplementation(() => mockChatService)
  })

  it('should generate a chat response successfully', async () => {
    const mockContext = [
      { content: 'Our product costs $99', score: 0.9 },
      { content: 'We offer 24/7 support', score: 0.85 },
    ]
    
    mockVectorStore.similaritySearch.mockResolvedValue(mockContext)
    mockChatService.generateResponse.mockResolvedValue('Our product costs $99 and includes 24/7 support.')

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
    expect(data.success).toBe(true)
    expect(data.response).toBe('Our product costs $99 and includes 24/7 support.')
    expect(mockVectorStore.similaritySearch).toHaveBeenCalledWith(
      'What is the price?',
      'test-bot-123',
      5
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

  it('should handle vector store errors gracefully', async () => {
    mockVectorStore.similaritySearch.mockRejectedValue(new Error('Vector store error'))

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
    expect(data.error).toBe('Failed to generate response')
  })

  it('should handle conversation history', async () => {
    const mockContext = [{ content: 'Product info', score: 0.9 }]
    mockVectorStore.similaritySearch.mockResolvedValue(mockContext)
    mockChatService.generateResponse.mockResolvedValue('Based on our previous discussion...')

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        botId: 'test-bot-123',
        message: 'Tell me more',
        conversationId: 'conv-123',
        history: [
          { role: 'user', content: 'What products do you offer?' },
          { role: 'assistant', content: 'We offer various products...' }
        ]
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversationId).toBe('conv-123')
    expect(mockChatService.generateResponse).toHaveBeenCalledWith(
      'Tell me more',
      mockContext,
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'What products do you offer?' })
      ])
    )
  })
})