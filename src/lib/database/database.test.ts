import { DatabaseService } from './database'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }))
}))

describe('DatabaseService', () => {
  let dbService: DatabaseService
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    dbService = new DatabaseService('https://test.supabase.co', 'test-anon-key')
    mockSupabase = (createClient as jest.Mock).mock.results[0].value
  })

  describe('Workspace Management', () => {
    it('should create a workspace', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        name: 'Test Workspace',
        owner_id: 'user-1',
        created_at: new Date().toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockWorkspace, error: null })
          })
        })
      })

      const result = await dbService.createWorkspace('Test Workspace', 'user-1')

      expect(result).toEqual(mockWorkspace)
      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces')
    })

    it('should get workspaces for a user', async () => {
      const mockWorkspaces = [
        { id: 'workspace-1', name: 'Workspace 1', owner_id: 'user-1' },
        { id: 'workspace-2', name: 'Workspace 2', owner_id: 'user-1' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockWorkspaces, error: null })
        })
      })

      const result = await dbService.getUserWorkspaces('user-1')

      expect(result).toEqual(mockWorkspaces)
      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces')
    })
  })

  describe('Bot Management', () => {
    it('should create a bot', async () => {
      const mockBot = {
        id: 'bot-1',
        workspace_id: 'workspace-1',
        name: 'Test Bot',
        config: {
          greeting: 'Hello!',
          placeholder: 'Type your message...'
        },
        created_at: new Date().toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBot, error: null })
          })
        })
      })

      const result = await dbService.createBot({
        workspace_id: 'workspace-1',
        name: 'Test Bot',
        config: {
          greeting: 'Hello!',
          placeholder: 'Type your message...'
        }
      })

      expect(result).toEqual(mockBot)
      expect(mockSupabase.from).toHaveBeenCalledWith('bots')
    })

    it('should get bot by id', async () => {
      const mockBot = {
        id: 'bot-1',
        workspace_id: 'workspace-1',
        name: 'Test Bot',
        config: {}
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBot, error: null })
          })
        })
      })

      const result = await dbService.getBot('bot-1')

      expect(result).toEqual(mockBot)
      expect(mockSupabase.from).toHaveBeenCalledWith('bots')
    })

    it('should update bot', async () => {
      const updates = { name: 'Updated Bot' }
      const mockUpdatedBot = {
        id: 'bot-1',
        name: 'Updated Bot'
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdatedBot, error: null })
            })
          })
        })
      })

      const result = await dbService.updateBot('bot-1', updates)

      expect(result).toEqual(mockUpdatedBot)
      expect(mockSupabase.from).toHaveBeenCalledWith('bots')
    })
  })

  describe('Conversation Management', () => {
    it('should create a conversation', async () => {
      const mockConversation = {
        id: 'conv-1',
        bot_id: 'bot-1',
        session_id: 'session-1',
        messages: [],
        created_at: new Date().toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockConversation, error: null })
          })
        })
      })

      const result = await dbService.createConversation('bot-1', 'session-1')

      expect(result).toEqual(mockConversation)
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations')
    })

    it('should add message to conversation', async () => {
      const message = {
        role: 'user' as const,
        content: 'Hello'
      }

      const existingConversation = {
        id: 'conv-1',
        messages: []
      }

      const updatedConversation = {
        id: 'conv-1',
        messages: [message]
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingConversation, error: null })
          })
        })
      })

      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedConversation, error: null })
            })
          })
        })
      })

      const result = await dbService.addMessageToConversation('conv-1', message)

      expect(result).toEqual(updatedConversation)
    })
  })

  describe('Crawl Jobs', () => {
    it('should create a crawl job', async () => {
      const mockJob = {
        id: 'job-1',
        bot_id: 'bot-1',
        status: 'pending',
        urls: ['https://example.com'],
        created_at: new Date().toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockJob, error: null })
          })
        })
      })

      const result = await dbService.createCrawlJob('bot-1', ['https://example.com'])

      expect(result).toEqual(mockJob)
      expect(mockSupabase.from).toHaveBeenCalledWith('crawl_jobs')
    })

    it('should update crawl job status', async () => {
      const mockUpdatedJob = {
        id: 'job-1',
        status: 'completed'
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdatedJob, error: null })
            })
          })
        })
      })

      const result = await dbService.updateCrawlJobStatus('job-1', 'completed')

      expect(result).toEqual(mockUpdatedJob)
      expect(mockSupabase.from).toHaveBeenCalledWith('crawl_jobs')
    })
  })

  describe('API Keys', () => {
    it('should create an API key', async () => {
      const mockApiKey = {
        id: 'key-1',
        workspace_id: 'workspace-1',
        key_hash: 'hashed-key',
        created_at: new Date().toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockApiKey, error: null })
          })
        })
      })

      const result = await dbService.createApiKey('workspace-1')

      expect(result).toHaveProperty('key')
      expect(result).toHaveProperty('keyHash')
      expect(mockSupabase.from).toHaveBeenCalledWith('api_keys')
    })

    it('should validate an API key', async () => {
      const mockApiKey = {
        id: 'key-1',
        workspace_id: 'workspace-1',
        key_hash: 'hashed-key'
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [mockApiKey], error: null })
        })
      })

      const result = await dbService.validateApiKey('hashed-key')

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('api_keys')
    })
  })

  describe('Error Handling', () => {
    it('should throw error when database operation fails', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      })

      await expect(dbService.createWorkspace('Test', 'user-1')).rejects.toThrow('Database error')
    })
  })
})