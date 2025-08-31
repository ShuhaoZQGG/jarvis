import { TeamService } from './team'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}))

describe('TeamService', () => {
  let service: TeamService
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
    service = new TeamService('http://localhost', 'test-key')
  })

  describe('inviteTeamMember', () => {
    it('should create a team invitation', async () => {
      const userId = 'user-123'
      const workspaceId = 'workspace-123'
      const inviteData = {
        email: 'member@example.com',
        role: 'member' as const
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockInsert = jest.fn().mockResolvedValue({
        data: { 
          id: 'invite-123',
          workspace_id: workspaceId,
          invited_email: inviteData.email,
          role: inviteData.role,
          invited_by: userId,
          status: 'pending'
        },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockInsert
          })
        })
      })

      const result = await service.inviteTeamMember(workspaceId, inviteData)

      expect(result).toEqual({
        id: 'invite-123',
        workspace_id: workspaceId,
        invited_email: 'member@example.com',
        role: 'member',
        invited_by: userId,
        status: 'pending'
      })
    })

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(
        service.inviteTeamMember('workspace-123', { email: 'test@example.com', role: 'member' })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('getTeamMembers', () => {
    it('should return team members for a workspace', async () => {
      const userId = 'user-123'
      const workspaceId = 'workspace-123'
      const members = [
        { id: 'member-1', user_id: 'user-1', workspace_id: workspaceId, role: 'admin' },
        { id: 'member-2', user_id: 'user-2', workspace_id: workspaceId, role: 'member' }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockSelect = jest.fn().mockResolvedValue({
        data: members,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockSelect())
        })
      })

      const result = await service.getTeamMembers(workspaceId)
      expect(result).toEqual(members)
    })
  })

  describe('removeTeamMember', () => {
    it('should remove team member from workspace', async () => {
      const userId = 'user-123'
      const workspaceId = 'workspace-123'
      const memberId = 'member-123'

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

      await expect(service.removeTeamMember(workspaceId, memberId)).resolves.not.toThrow()
    })
  })

  describe('updateMemberRole', () => {
    it('should update team member role', async () => {
      const userId = 'user-123'
      const workspaceId = 'workspace-123'
      const memberId = 'member-123'
      const newRole = 'admin' as const

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockUpdate = jest.fn().mockResolvedValue({
        data: { 
          id: memberId,
          workspace_id: workspaceId,
          role: newRole
        },
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

      const result = await service.updateMemberRole(workspaceId, memberId, newRole)
      expect(result).toEqual({
        id: memberId,
        workspace_id: workspaceId,
        role: 'admin'
      })
    })
  })

  describe('getPendingInvitations', () => {
    it('should return pending invitations for workspace', async () => {
      const userId = 'user-123'
      const workspaceId = 'workspace-123'
      const invitations = [
        { 
          id: 'invite-1',
          workspace_id: workspaceId,
          invited_email: 'user1@example.com',
          status: 'pending'
        },
        { 
          id: 'invite-2',
          workspace_id: workspaceId,
          invited_email: 'user2@example.com',
          status: 'pending'
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const mockSelect = jest.fn().mockResolvedValue({
        data: invitations,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(mockSelect())
          })
        })
      })

      const result = await service.getPendingInvitations(workspaceId)
      expect(result).toEqual(invitations)
    })
  })
})