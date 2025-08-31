import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatWidget from './ChatWidget'

// Mock fetch for API calls
global.fetch = jest.fn()

const mockBotConfig = {
  id: 'test-bot-123',
  name: 'Test Bot',
  settings: {
    greeting: 'Hello! How can I help you today?',
    primaryColor: '#0066CC',
    position: 'bottom-right' as const,
    widgetType: 'bubble' as const,
    autoOpen: false,
    responseDelay: 500,
  }
}

describe('ChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockBotConfig
    })
  })
  
  it('should render chat bubble initially', async () => {
    render(<ChatWidget botId="test-bot-123" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument()
    })
  })
  
  it('should open chat window when bubble is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatWidget botId="test-bot-123" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument()
    })
    
    const bubble = screen.getByTestId('chat-bubble')
    await user.click(bubble)
    
    expect(screen.getByTestId('chat-window')).toBeInTheDocument()
    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
  })
  
  it('should close chat window when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatWidget botId="test-bot-123" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument()
    })
    
    // Open chat
    const bubble = screen.getByTestId('chat-bubble')
    await user.click(bubble)
    
    expect(screen.getByTestId('chat-window')).toBeInTheDocument()
    
    // Close chat
    const closeButton = screen.getByLabelText('Close chat')
    await user.click(closeButton)
    
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument()
  })
  
  it('should send message when user types and submits', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/chat')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'This is a bot response' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockBotConfig
      })
    })
    
    render(<ChatWidget botId="test-bot-123" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument()
    })
    
    // Open chat
    const bubble = screen.getByTestId('chat-bubble')
    await user.click(bubble)
    
    // Type message
    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Hello bot!')
    
    // Send message
    const sendButton = screen.getByLabelText('Send message')
    await user.click(sendButton)
    
    // Check user message appears
    expect(screen.getByText('Hello bot!')).toBeInTheDocument()
    
    // Check bot response appears
    await waitFor(() => {
      expect(screen.getByText('This is a bot response')).toBeInTheDocument()
    })
  })
  
  it('should show typing indicator while waiting for response', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/chat')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ message: 'Bot response' })
            })
          }, 1000)
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockBotConfig
      })
    })
    
    render(<ChatWidget botId="test-bot-123" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument()
    })
    
    // Open chat
    const bubble = screen.getByTestId('chat-bubble')
    await user.click(bubble)
    
    // Send message
    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Test message')
    const sendButton = screen.getByLabelText('Send message')
    await user.click(sendButton)
    
    // Check typing indicator appears
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    
    // Wait for response and check typing indicator disappears
    await waitFor(() => {
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
    })
  })
  
  it('should auto-open if configured', async () => {
    const autoOpenConfig = {
      ...mockBotConfig,
      settings: {
        ...mockBotConfig.settings,
        autoOpen: true
      }
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => autoOpenConfig
    })
    
    render(<ChatWidget botId="test-bot-123" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-window')).toBeInTheDocument()
    })
  })
  
  it('should position widget according to configuration', async () => {
    const bottomLeftConfig = {
      ...mockBotConfig,
      settings: {
        ...mockBotConfig.settings,
        position: 'bottom-left' as const
      }
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => bottomLeftConfig
    })
    
    render(<ChatWidget botId="test-bot-123" />)
    
    await waitFor(() => {
      const bubble = screen.getByTestId('chat-bubble')
      expect(bubble).toHaveClass('bottom-4', 'left-4')
    })
  })
})