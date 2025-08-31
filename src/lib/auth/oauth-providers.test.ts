import { oauthProviders, signInWithOAuth, linkOAuthAccount, unlinkOAuthAccount } from './oauth-providers'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('OAuth Providers', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn(),
        linkIdentity: jest.fn(),
        unlinkIdentity: jest.fn(),
        getUser: jest.fn()
      }
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('oauthProviders', () => {
    it('should export the correct providers', () => {
      expect(oauthProviders).toHaveLength(3)
      
      const google = oauthProviders.find(p => p.id === 'google')
      expect(google).toBeDefined()
      expect(google?.name).toBe('Google')
      expect(google?.icon).toBe('🔍')
      
      const github = oauthProviders.find(p => p.id === 'github')
      expect(github).toBeDefined()
      expect(github?.name).toBe('GitHub')
      expect(github?.icon).toBe('🐙')
      
      const discord = oauthProviders.find(p => p.id === 'discord')
      expect(discord).toBeDefined()
      expect(discord?.name).toBe('Discord')
      expect(discord?.icon).toBe('💬')
    })

    it('should have correct styling classes', () => {
      const google = oauthProviders.find(p => p.id === 'google')
      expect(google?.color).toContain('bg-white')
      expect(google?.color).toContain('text-gray-900')
      
      const github = oauthProviders.find(p => p.id === 'github')
      expect(github?.color).toContain('bg-gray-900')
      expect(github?.color).toContain('text-white')
      
      const discord = oauthProviders.find(p => p.id === 'discord')
      expect(discord?.color).toContain('bg-indigo-600')
      expect(discord?.color).toContain('text-white')
    })
  })

  describe('signInWithOAuth', () => {
    it('should call Supabase signInWithOAuth with correct parameters', async () => {
      const mockData = { url: 'https://oauth.provider.com/auth' }
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: mockData, error: null })

      const result = await signInWithOAuth('google')

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      expect(result).toEqual(mockData)
    })

    it('should throw error when sign in fails', async () => {
      const mockError = new Error('OAuth error')
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: null, error: mockError })

      await expect(signInWithOAuth('github')).rejects.toThrow('OAuth error')
    })

    it('should work with all supported providers', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

      for (const provider of ['google', 'github', 'discord'] as const) {
        await signInWithOAuth(provider)
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
          expect.objectContaining({ provider })
        )
      }
    })
  })

  describe('linkOAuthAccount', () => {
    it('should call Supabase linkIdentity with correct parameters', async () => {
      const mockData = { url: 'https://oauth.provider.com/link' }
      mockSupabase.auth.linkIdentity.mockResolvedValue({ data: mockData, error: null })

      const result = await linkOAuthAccount('github')

      expect(mockSupabase.auth.linkIdentity).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.stringContaining('/settings/accounts')
        }
      })
      expect(result).toEqual(mockData)
    })

    it('should throw error when linking fails', async () => {
      const mockError = new Error('Link error')
      mockSupabase.auth.linkIdentity.mockResolvedValue({ data: null, error: mockError })

      await expect(linkOAuthAccount('discord')).rejects.toThrow('Link error')
    })
  })

  describe('unlinkOAuthAccount', () => {
    it('should unlink OAuth account successfully', async () => {
      const mockUser = {
        id: 'user123',
        identities: [
          { id: 'identity1', provider: 'google' },
          { id: 'identity2', provider: 'github' }
        ]
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.auth.unlinkIdentity.mockResolvedValue({ error: null })

      const result = await unlinkOAuthAccount('github')

      expect(mockSupabase.auth.unlinkIdentity).toHaveBeenCalledWith({
        identity_id: 'identity2'
      })
      expect(result).toBe(true)
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      await expect(unlinkOAuthAccount('google')).rejects.toThrow('No authenticated user')
    })

    it('should throw error when provider is not linked', async () => {
      const mockUser = {
        id: 'user123',
        identities: [
          { id: 'identity1', provider: 'google' }
        ]
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      await expect(unlinkOAuthAccount('github')).rejects.toThrow('No github account linked')
    })

    it('should throw error when unlink fails', async () => {
      const mockUser = {
        id: 'user123',
        identities: [
          { id: 'identity1', provider: 'google' }
        ]
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.auth.unlinkIdentity.mockResolvedValue({ error: new Error('Unlink failed') })

      await expect(unlinkOAuthAccount('google')).rejects.toThrow('Unlink failed')
    })
  })
})