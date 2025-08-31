import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ResetPasswordPage from './page'
import { AuthService } from '@/lib/auth/auth'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth service
jest.mock('@/lib/auth/auth', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    resetPassword: jest.fn(),
    getCurrentUser: jest.fn(),
  })),
}))

describe('ResetPasswordPage', () => {
  const mockPush = jest.fn()
  const mockResetPassword = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(AuthService as jest.Mock).mockImplementation(() => ({
      resetPassword: mockResetPassword,
      getCurrentUser: jest.fn().mockResolvedValue(null),
    }))
  })

  it('renders reset password form with all required elements', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument()
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    expect(screen.getByText(/remember your password/i)).toBeInTheDocument()
  })

  it('displays validation error for empty email', async () => {
    render(<ResetPasswordPage />)

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('displays validation error for invalid email', async () => {
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('successfully sends reset email with valid email', async () => {
    mockResetPassword.mockResolvedValue({ success: true })
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
      expect(screen.getByText(/we've sent a password reset link to/i)).toBeInTheDocument()
    })
  })

  it('displays error message when email not found', async () => {
    mockResetPassword.mockRejectedValue(new Error('User not found'))
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/no account found with this email/i)).toBeInTheDocument()
    })
  })

  it('shows loading state while sending reset email', async () => {
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    expect(screen.getByText(/sending/i)).toBeInTheDocument()
  })

  it('navigates back to login page when link is clicked', () => {
    render(<ResetPasswordPage />)

    const loginLink = screen.getByText(/back to login/i)
    fireEvent.click(loginLink)

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('shows resend option after successful submission', async () => {
    mockResetPassword.mockResolvedValue({ success: true })
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/didn't receive the email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
    })
  })

  it('can resend reset email', async () => {
    mockResetPassword.mockResolvedValue({ success: true })
    render(<ResetPasswordPage />)

    // First submission
    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
    })

    // Resend
    const resendButton = screen.getByRole('button', { name: /resend/i })
    fireEvent.click(resendButton)

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledTimes(2)
      expect(mockResetPassword).toHaveBeenLastCalledWith('test@example.com')
    })
  })

  it('redirects to dashboard if already authenticated', async () => {
    ;(AuthService as jest.Mock).mockImplementation(() => ({
      resetPassword: mockResetPassword,
      getCurrentUser: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com' }),
    }))

    render(<ResetPasswordPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows rate limit message when too many attempts', async () => {
    mockResetPassword.mockRejectedValue(new Error('Rate limit exceeded'))
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument()
    })
  })
})