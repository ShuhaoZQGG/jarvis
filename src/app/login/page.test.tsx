import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from './page'
import { AuthService } from '@/lib/auth/auth'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth service
jest.mock('@/lib/auth/auth', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    signIn: jest.fn(),
    getCurrentUser: jest.fn(),
  })),
}))

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockSignIn = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(AuthService as jest.Mock).mockImplementation(() => ({
      signIn: mockSignIn,
      getCurrentUser: jest.fn().mockResolvedValue(null),
    }))
  })

  it('renders login form with all required elements', () => {
    render(<LoginPage />)

    expect(screen.getByText(/sign in to jarvis/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })

  it('displays validation errors for empty fields', async () => {
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('displays validation error for invalid email', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('displays validation error for short password', async () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    fireEvent.change(passwordInput, { target: { value: '123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('successfully signs in with valid credentials', async () => {
    mockSignIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } })
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('displays error message for invalid credentials', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during sign in', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('navigates to signup page when link is clicked', () => {
    render(<LoginPage />)

    const signupLink = screen.getByText(/create account/i)
    fireEvent.click(signupLink)

    expect(mockPush).toHaveBeenCalledWith('/signup')
  })

  it('navigates to password reset page when link is clicked', () => {
    render(<LoginPage />)

    const resetLink = screen.getByText(/forgot password/i)
    fireEvent.click(resetLink)

    expect(mockPush).toHaveBeenCalledWith('/reset-password')
  })

  it('redirects to dashboard if already authenticated', async () => {
    ;(AuthService as jest.Mock).mockImplementation(() => ({
      signIn: mockSignIn,
      getCurrentUser: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com' }),
    }))

    render(<LoginPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})