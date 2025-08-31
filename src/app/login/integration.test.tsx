import { render, screen, fireEvent, waitFor } from '@/test/utils'
import LoginPage from './page'
import DashboardPage from '../dashboard/page'
import { routerMocks } from '@/test/utils'

// Mock AuthService
const mockSignIn = jest.fn()
const mockGetCurrentUser = jest.fn()

jest.mock('@/lib/auth/auth', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    signIn: mockSignIn,
    getCurrentUser: mockGetCurrentUser,
  }))
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Invalid email format
    fireEvent.change(emailInput, { target: { value: 'notanemail' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled()
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
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