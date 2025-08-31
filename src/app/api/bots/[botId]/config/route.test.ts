/**
 * @jest-environment node
 */

import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => {
  const mockSingle = jest.fn()
  const mockEq = jest.fn(() => ({ single: mockSingle }))
  const mockSelect = jest.fn(() => ({ eq: mockEq }))
  const mockFrom = jest.fn(() => ({ select: mockSelect }))
  
  return {
    supabase: {
      from: mockFrom
    },
    __mocks: {
      mockSingle,
      mockEq,
      mockSelect,
      mockFrom
    }
  }
})

const getMocks = () => (require('@/lib/supabase') as any).__mocks

describe('Bot Config API Route', () => {
  let mockSingle: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockSingle = getMocks().mockSingle
  })

  it('should return bot configuration successfully', async () => {
    const mockBot = {
      id: 'bot-123',
      name: 'Support Bot',
      settings: {
        greeting: 'Welcome! How can I assist you?',
        primaryColor: '#FF0000',
        position: 'bottom-left',
        widgetType: 'sidebar',
        autoOpen: true,
        responseDelay: 1000,
        placeholder: 'Ask me anything...'
      }
    }

    getMocks().mockSingle.mockResolvedValue({
      data: mockBot,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/bots/bot-123/config')
    const response = await GET(request, { params: { botId: 'bot-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      id: 'bot-123',
      name: 'Support Bot',
      settings: {
        greeting: 'Welcome! How can I assist you?',
        primaryColor: '#FF0000',
        position: 'bottom-left',
        widgetType: 'sidebar',
        autoOpen: true,
        responseDelay: 1000,
        placeholder: 'Ask me anything...'
      }
    })
  })

  it('should return default settings when bot settings are empty', async () => {
    const mockBot = {
      id: 'bot-456',
      name: 'Default Bot',
      settings: null
    }

    getMocks().mockSingle.mockResolvedValue({
      data: mockBot,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/bots/bot-456/config')
    const response = await GET(request, { params: { botId: 'bot-456' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      id: 'bot-456',
      name: 'Default Bot',
      settings: {
        greeting: 'Hi! How can I help you today?',
        primaryColor: '#0066FF',
        position: 'bottom-right',
        widgetType: 'bubble',
        autoOpen: false,
        responseDelay: 500,
        placeholder: 'Type your message...'
      }
    })
  })

  it('should handle bot not found error', async () => {
    getMocks().mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Not found', code: 'PGRST116' }
    })

    const request = new NextRequest('http://localhost:3000/api/bots/unknown-bot/config')
    const response = await GET(request, { params: { botId: 'unknown-bot' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Bot not found' })
  })

  it('should handle database errors gracefully', async () => {
    getMocks().mockSingle.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/bots/bot-123/config')
    const response = await GET(request, { params: { botId: 'bot-123' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch bot configuration' })
  })

  it('should handle partial settings correctly', async () => {
    const mockBot = {
      id: 'bot-789',
      name: 'Partial Bot',
      settings: {
        greeting: 'Custom greeting',
        primaryColor: '#00FF00'
        // Other settings missing
      }
    }

    getMocks().mockSingle.mockResolvedValue({
      data: mockBot,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/bots/bot-789/config')
    const response = await GET(request, { params: { botId: 'bot-789' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.settings).toEqual({
      greeting: 'Custom greeting',
      primaryColor: '#00FF00',
      position: 'bottom-right', // Default value
      widgetType: 'bubble', // Default value
      autoOpen: false, // Default value
      responseDelay: 500, // Default value
      placeholder: 'Type your message...' // Default value
    })
  })
})