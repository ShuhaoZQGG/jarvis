import { WorkspaceService } from './workspace'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}))

describe('WorkspaceService', () => {
  let service: WorkspaceService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      }))
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    service = new WorkspaceService('http://localhost', 'test-key')
  })

  describe('createWorkspace', () => {
    it('should create a new workspace', async () => {
      const userId = 'user-123'
      const workspaceData = {
        name: 'My Workspace',
        description: 'Test workspace'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'workspace-123', ...workspaceData, owner_id: userId },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockInsert
          })
        })
      })

      const result = await service.createWorkspace(workspaceData)

      expect(result).toEqual({
        id: 'workspace-123',
        name: 'My Workspace',
        description: 'Test workspace',
        owner_id: userId
      })
    })

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(service.createWorkspace({ name: 'Test' })).rejects.toThrow('User not authenticated')
    })
  })

  describe('getWorkspaces', () => {
    it('should return user workspaces', async () => {
      const userId = 'user-123'
      const workspaces = [
        { id: 'ws-1', name: 'Workspace 1', owner_id: userId },
        { id: 'ws-2', name: 'Workspace 2', owner_id: userId }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockSelect = jest.fn().mockResolvedValue({
        data: workspaces,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockSelect())
        })
      })

      const result = await service.getWorkspaces()
      expect(result).toEqual(workspaces)
    })
  })

  describe('updateWorkspace', () => {
    it('should update workspace', async () => {
      const userId = 'user-123'
      const workspaceId = 'ws-123'
      const updates = { name: 'Updated Name' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockUpdate = jest.fn().mockResolvedValue({
        data: { id: workspaceId, ...updates, owner_id: userId },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: mockUpdate
              })
            })
          })
        })
      })

      const result = await service.updateWorkspace(workspaceId, updates)
      expect(result).toEqual({
        id: workspaceId,
        name: 'Updated Name',
        owner_id: userId
      })
    })
  })

  describe('deleteWorkspace', () => {
    it('should delete workspace', async () => {
      const userId = 'user-123'
      const workspaceId = 'ws-123'

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockDelete = jest.fn().mockResolvedValue({
        error: null
      })

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(mockDelete())
          })
        })
      })

      await expect(service.deleteWorkspace(workspaceId)).resolves.not.toThrow()
    })
  })
})