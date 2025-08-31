import { render, screen, waitFor } from '@/test/utils'
import DashboardPage from './page'

// Mock AuthService
jest.mock('@/lib/auth/auth', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getCurrentUser: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    })
  }))
}))

// Mock the API calls
jest.mock('@/lib/api/bots', () => ({
  getBots: jest.fn().mockResolvedValue({
    data: [
      {
        id: '1',
        name: 'Customer Support Bot',
        url: 'https://example.com',
        status: 'active',
        conversations: 150,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Sales Assistant',
        url: 'https://shop.example.com',
        status: 'training',
        conversations: 0,
        created_at: '2024-01-02T00:00:00Z'
      }
    ]
  })
}))

jest.mock('@/lib/api/workspaces', () => ({
  getCurrentWorkspace: jest.fn().mockResolvedValue({
    data: {
      id: '1',
      name: 'My Workspace',
      plan: 'pro',
      usage: {
        bots: 2,
        conversations: 150,
        limit: 1000
      }
    }
  })
}))

describe('Dashboard Page', () => {
  it('should display dashboard header', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Jarvis Dashboard')).toBeInTheDocument()
    })
  })
  
  it('should display list of bots', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Support Bot')).toBeInTheDocument()
      expect(screen.getByText('Sales Bot')).toBeInTheDocument()
    })
  })
  
  it('should show bot status', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Training')).toBeInTheDocument()
    })
  })
  
  it('should display bot count', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Bots')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
  
  it('should have create bot button', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Create Bot')).toBeInTheDocument()
    })
  })
})