import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { AuthService } from '@/lib/auth/auth'
import { DatabaseService } from '@/lib/database/database'

jest.mock('@/lib/auth/auth')
jest.mock('@/lib/database/database')

describe('/api/workspaces', () => {
  let mockAuthService: jest.Mocked<AuthService>
  let mockDbService: jest.Mocked<DatabaseService>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockAuthService = {
      getCurrentUser: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      getSupabaseClient: jest.fn()
    } as any

    mockDbService = {
      getUserWorkspaces: jest.fn(),
      createWorkspace: jest.fn(),
      getWorkspace: jest.fn(),
      updateWorkspace: jest.fn(),
      deleteWorkspace: jest.fn(),
      getWorkspaceMembers: jest.fn(),
      addWorkspaceMember: jest.fn(),
      removeWorkspaceMember: jest.fn()
    } as any

    ;(AuthService as jest.Mock).mockImplementation(() => mockAuthService)
    ;(DatabaseService as jest.Mock).mockImplementation(() => mockDbService)
  })

  describe('GET /api/workspaces', () => {
    it('should return user workspaces', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }
      const mockWorkspaces = [
        { id: 'ws-1', name: 'Workspace 1', owner_id: 'user-123' },
        { id: 'ws-2', name: 'Workspace 2', owner_id: 'user-123' }
      ]

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
      mockDbService.getUserWorkspaces.mockResolvedValue(mockWorkspaces)

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.workspaces).toEqual(mockWorkspaces)
    })

    it('should return 401 if not authenticated', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }
      const newWorkspace = { 
        id: 'ws-new', 
        name: 'New Workspace', 
        owner_id: 'user-123' 
      }

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
      mockDbService.createWorkspace.mockResolvedValue(newWorkspace)

      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Workspace' })
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.workspace).toEqual(newWorkspace)
    })

    it('should validate workspace name', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: '' })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('name')
    })
  })
})