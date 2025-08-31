import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SignupPage from './page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the auth context
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

describe('SignupPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
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

  it('renders signup form with all required elements', () => {
    render(<SignupPage />)

    expect(screen.getByText(/create your account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it('displays validation errors for empty fields', async () => {
    render(<SignupPage />)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getAllByText(/password is required/i)[0]).toBeInTheDocument()
    })
  })

  it('displays validation error for invalid email', async () => {
    render(<SignupPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the terms and conditions/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('displays validation error for weak password', async () => {
    render(<SignupPage />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    fireEvent.change(passwordInput, { target: { value: '123' } })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('displays validation error when passwords do not match', async () => {
    render(<SignupPage />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('displays validation error for name that is too short', async () => {
    render(<SignupPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    fireEvent.change(nameInput, { target: { value: 'J' } })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('successfully signs up with valid information', async () => {
    mockSignUp.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } })
    render(<SignupPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the terms and conditions/i })

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', {
        full_name: 'John Doe',
      })
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('displays error message when email already exists', async () => {
    mockSignUp.mockRejectedValue(new Error('User already exists'))
    render(<SignupPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the terms and conditions/i })

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during sign up', async () => {
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<SignupPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the terms and conditions/i })

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
  })

  it('navigates to login page when link is clicked', () => {
    render(<SignupPage />)

    const loginLink = screen.getByText(/sign in/i)
    fireEvent.click(loginLink)

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('redirects to dashboard if already authenticated', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      refreshUser: mockRefreshUser,
      authService: {},
    })

    render(<SignupPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('accepts terms and conditions checkbox', () => {
    render(<SignupPage />)

    const termsCheckbox = screen.getByLabelText(/i agree to the terms/i)
    expect(termsCheckbox).toBeInTheDocument()
    expect(termsCheckbox).not.toBeChecked()

    fireEvent.click(termsCheckbox)
    expect(termsCheckbox).toBeChecked()
  })

  it('requires terms acceptance before signup', async () => {
    render(<SignupPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument()
    })
  })
})