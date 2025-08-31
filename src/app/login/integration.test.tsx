import { render, screen, fireEvent, waitFor, act } from '@/test/utils'
import LoginPage from './page'
import DashboardPage from '../dashboard/page'
import { routerMocks } from '@/test/utils'

// Mock auth context
const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()
const mockRefreshUser = jest.fn()

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Import the mocked function
import { useAuth } from '@/contexts/auth-context'

// Mock AuthService for dashboard
const mockGetCurrentUser = jest.fn()

jest.mock('@/lib/auth/auth', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getCurrentUser: mockGetCurrentUser,
  }))
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      refreshUser: mockRefreshUser,
      authService: {},
    })
  })

  it('should redirect to dashboard after successful login', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'test-id', email: 'test@example.com' } })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(routerMocks.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should redirect to login if not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalled()
      expect(routerMocks.push).toHaveBeenCalledWith('/login')
    })
  })

  it('should handle login failures gracefully', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      expect(routerMocks.push).not.toHaveBeenCalled()
    })
  })

  it('should maintain authenticated session across pages', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'test-id', email: 'test@example.com' })
    
    // User visits dashboard while authenticated
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalled()
      expect(routerMocks.push).not.toHaveBeenCalledWith('/login')
      expect(screen.getByText('Jarvis Dashboard')).toBeInTheDocument()
    })
  })

  it('should validate email format before submission', async () => {
    const { getByLabelText, getByRole, getByText } = render(<LoginPage />)
    
    const emailInput = getByLabelText(/email/i)
    const passwordInput = getByLabelText(/password/i)
    const submitButton = getByRole('button', { name: /sign in/i })
    
    // Invalid email format
    fireEvent.change(emailInput, { target: { value: 'notanemail' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    await act(async () => {
      fireEvent.click(submitButton)
    })
    
    expect(mockSignIn).not.toHaveBeenCalled()
    expect(getByText(/please enter a valid email/i)).toBeInTheDocument()
  })

  it('should validate password length before submission', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Password too short
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled()
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })
})