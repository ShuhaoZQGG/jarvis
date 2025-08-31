import {
  generateApiKey,
  validateApiKeyFormat,
  hashApiKey,
  extractKeyPrefix,
  isKeyExpired,
  maskApiKey,
  hasPermission,
  DEFAULT_PERMISSIONS,
  ADMIN_PERMISSIONS
} from './index'

describe('API Keys', () => {
  describe('generateApiKey', () => {
    it('should generate a valid API key with default prefix', () => {
      const { key, hash } = generateApiKey()
      
      expect(key).toMatch(/^jrv_[A-Za-z0-9\-_]{43}$/)
      expect(hash).toHaveLength(64) // SHA-256 hex string
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate a valid API key with custom prefix', () => {
      const { key, hash } = generateApiKey('test')
      
      expect(key).toMatch(/^test_[A-Za-z0-9\-_]{43}$/)
      expect(hash).toHaveLength(64)
    })

    it('should generate unique keys', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()
      
      expect(key1.key).not.toBe(key2.key)
      expect(key1.hash).not.toBe(key2.hash)
    })
  })

  describe('validateApiKeyFormat', () => {
    it('should validate correct format', () => {
      const { key } = generateApiKey()
      expect(validateApiKeyFormat(key)).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(validateApiKeyFormat('invalid')).toBe(false)
      expect(validateApiKeyFormat('jrv_')).toBe(false)
      expect(validateApiKeyFormat('jrv_short')).toBe(false)
      expect(validateApiKeyFormat('wrong_prefix_12345678901234567890123456789012345678901234')).toBe(false)
    })
  })

  describe('hashApiKey', () => {
    it('should produce consistent hash for same key', () => {
      const key = 'jrv_testkey123'
      const hash1 = hashApiKey(key)
      const hash2 = hashApiKey(key)
      
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)
    })

    it('should produce different hashes for different keys', () => {
      const hash1 = hashApiKey('key1')
      const hash2 = hashApiKey('key2')
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('extractKeyPrefix', () => {
    it('should extract prefix correctly', () => {
      expect(extractKeyPrefix('jrv_somekey')).toBe('jrv')
      expect(extractKeyPrefix('test_anotherkey')).toBe('test')
      expect(extractKeyPrefix('noprefix')).toBe('noprefix')
      expect(extractKeyPrefix('')).toBe('')
    })
  })

  describe('isKeyExpired', () => {
    it('should return false for non-expiring keys', () => {
      expect(isKeyExpired(undefined)).toBe(false)
      expect(isKeyExpired(null)).toBe(false)
    })

    it('should return false for future expiry dates', () => {
      const futureDate = new Date(Date.now() + 86400000) // Tomorrow
      expect(isKeyExpired(futureDate)).toBe(false)
    })

    it('should return true for past expiry dates', () => {
      const pastDate = new Date(Date.now() - 86400000) // Yesterday
      expect(isKeyExpired(pastDate)).toBe(true)
    })
  })

  describe('maskApiKey', () => {
    it('should mask API keys correctly', () => {
      const key = 'jrv_1234567890abcdefghijklmnopqrstuvwxyz'
      expect(maskApiKey(key)).toBe('jrv_123...wxyz')
    })

    it('should handle short keys', () => {
      expect(maskApiKey('short')).toBe('***')
      expect(maskApiKey('')).toBe('***')
    })

    it('should mask generated keys', () => {
      const { key } = generateApiKey()
      const masked = maskApiKey(key)
      
      expect(masked).toMatch(/^jrv_[A-Za-z0-9\-_]{3}\.\.\.[A-Za-z0-9\-_]{4}$/)
      expect(masked).not.toBe(key)
    })
  })

  describe('hasPermission', () => {
    it('should check exact permissions', () => {
      const permissions = ['chatbot:read', 'chatbot:write']
      
      expect(hasPermission(permissions, 'chatbot:read')).toBe(true)
      expect(hasPermission(permissions, 'chatbot:write')).toBe(true)
      expect(hasPermission(permissions, 'chatbot:delete')).toBe(false)
      expect(hasPermission(permissions, 'user:read')).toBe(false)
    })

    it('should handle wildcard permissions', () => {
      const permissions = ['chatbot:*', 'analytics:read']
      
      expect(hasPermission(permissions, 'chatbot:read')).toBe(true)
      expect(hasPermission(permissions, 'chatbot:write')).toBe(true)
      expect(hasPermission(permissions, 'chatbot:delete')).toBe(true)
      expect(hasPermission(permissions, 'analytics:read')).toBe(true)
      expect(hasPermission(permissions, 'analytics:write')).toBe(false)
    })

    it('should verify default permissions', () => {
      expect(DEFAULT_PERMISSIONS).toContain('chatbot:read')
      expect(DEFAULT_PERMISSIONS).toContain('chatbot:write')
      expect(DEFAULT_PERMISSIONS).toContain('conversation:read')
      expect(DEFAULT_PERMISSIONS).toContain('analytics:read')
      expect(DEFAULT_PERMISSIONS).not.toContain('workspace:manage')
    })

    it('should verify admin permissions', () => {
      expect(ADMIN_PERMISSIONS).toContain('chatbot:read')
      expect(ADMIN_PERMISSIONS).toContain('workspace:manage')
      expect(ADMIN_PERMISSIONS).toContain('user:manage')
      expect(ADMIN_PERMISSIONS).toContain('billing:manage')
      expect(ADMIN_PERMISSIONS).toContain('apikey:manage')
    })
  })
})