'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'

interface BotSettings {
  greeting: string
  primaryColor: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  widgetType: 'bubble' | 'sidebar' | 'modal' | 'inline'
  autoOpen: boolean
  responseDelay: number
}

interface BotConfig {
  id: string
  name: string
  settings: BotSettings
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatWidgetProps {
  botId: string
  primaryColor?: string
  position?: 'bottom-right' | 'bottom-left'
  greeting?: string
}

export default function ChatWidget({ botId, primaryColor = '#0ea5e9', position = 'bottom-right', greeting = 'Hi! How can I help you today?' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Load bot configuration
    loadBotConfig()
  }, [botId])
  
  useEffect(() => {
    // Auto-open if configured
    if (botConfig?.settings.autoOpen) {
      setIsOpen(true)
    }
  }, [botConfig])
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Add greeting message when chat opens
    if (isOpen && messages.length === 0 && botConfig) {
      setMessages([{
        id: '1',
        text: botConfig.settings.greeting,
        sender: 'bot',
        timestamp: new Date()
      }])
    }
  }, [isOpen, botConfig])
  
  const loadBotConfig = async () => {
    try {
      const response = await fetch(`/api/bots/${botId}/config`)
      if (response.ok) {
        const data = await response.json()
        setBotConfig(data)
      }
    } catch (error) {
      console.error('Failed to load bot config:', error)
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const sendMessage = async () => {
    if (!inputValue.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          message: inputValue
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Simulate response delay
        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.message,
            sender: 'bot',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, botMessage])
          setIsTyping(false)
        }, botConfig?.settings.responseDelay || 500)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsTyping(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  if (!botConfig) return null
  
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }
  
  const windowPositionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  }
  
  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          data-testid="chat-bubble"
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[botConfig.settings.position]} z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110`}
          style={{ backgroundColor: botConfig.settings.primaryColor }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div
          data-testid="chat-window"
          className={`fixed ${windowPositionClasses[botConfig.settings.position]} z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col`}
        >
          {/* Header */}
          <div 
            className="p-4 text-white rounded-t-lg flex justify-between items-center"
            style={{ backgroundColor: botConfig.settings.primaryColor }}
          >
            <h3 className="font-semibold">{botConfig.name}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div 
                  data-testid="typing-indicator"
                  className="bg-gray-100 px-3 py-2 rounded-lg"
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="p-2 text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: botConfig.settings.primaryColor }}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}