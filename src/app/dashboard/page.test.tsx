import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import DashboardPage from './page'

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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Dashboard Page', () => {
  it('should display workspace name and plan', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('My Workspace')).toBeInTheDocument()
      expect(screen.getByText('Pro Plan')).toBeInTheDocument()
    })
  })
  
  it('should display list of bots', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('Customer Support Bot')).toBeInTheDocument()
      expect(screen.getByText('Sales Assistant')).toBeInTheDocument()
    })
  })
  
  it('should show bot status indicators', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Training')).toBeInTheDocument()
    })
  })
  
  it('should display usage statistics', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('2 Bots')).toBeInTheDocument()
      expect(screen.getByText('150 / 1000')).toBeInTheDocument()
    })
  })
  
  it('should have create new bot button', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new bot/i })).toBeInTheDocument()
    })
  })
})