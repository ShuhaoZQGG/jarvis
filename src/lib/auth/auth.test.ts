import { AuthService } from './auth'
import { createBrowserClient } from '@supabase/ssr'

// Mock Supabase SSR client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}))

describe('AuthService', () => {
  let authService: AuthService
  let mockSupabaseClient: any

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
        getSession: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
      },
    }
    ;(createBrowserClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    
    authService = new AuthService('https://test.supabase.co', 'test-anon-key')
  })

  describe('signUp', () => {
    it('should sign up a new user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      const result = await authService.signUp('test@example.com', 'password123')

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: undefined,
        },
      })
      expect(result).toEqual({ user: mockUser, session: {} })
    })

    it('should throw error when sign up fails', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' },
      })

      await expect(authService.signUp('test@example.com', 'password123'))
        .rejects.toThrow('Email already exists')
    })
  })

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123' }
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await authService.signIn('test@example.com', 'password123')

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual({ user: mockUser, session: mockSession })
    })

    it('should throw error when sign in fails', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      await expect(authService.signIn('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      await authService.signOut()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error when sign out fails', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      await expect(authService.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123' }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await authService.getCurrentUser()

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should return null when no session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await authService.getCurrentUser()

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      await authService.resetPassword('test@example.com')

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: expect.stringContaining('/reset-password') }
      )
    })

    it('should throw error when reset password fails', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      })

      await expect(authService.resetPassword('test@example.com'))
        .rejects.toThrow('User not found')
    })
  })
})