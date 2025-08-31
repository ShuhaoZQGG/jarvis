import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter, withRateLimit } from './ratelimit'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    jest.useFakeTimers()
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 10
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('isAllowed', () => {
    it('should allow requests within limit', async () => {
      const identifier = 'user-123'
      
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.isAllowed(identifier)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(9 - i)
      }
    })

    it('should block requests exceeding limit', async () => {
      const identifier = 'user-123'
      
      // Make 10 allowed requests
      for (let i = 0; i < 10; i++) {
        await rateLimiter.isAllowed(identifier)
      }

      // 11th request should be blocked
      const result = await rateLimiter.isAllowed(identifier)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetAt).toBeDefined()
    })

    it('should reset after time window', async () => {
      const identifier = 'user-123'
      
      // Max out requests
      for (let i = 0; i < 10; i++) {
        await rateLimiter.isAllowed(identifier)
      }

      // Should be blocked
      let result = await rateLimiter.isAllowed(identifier)
      expect(result.allowed).toBe(false)

      // Advance time by 1 minute
      jest.advanceTimersByTime(60000)

      // Should be allowed again
      result = await rateLimiter.isAllowed(identifier)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('should track different identifiers separately', async () => {
      const user1 = 'user-123'
      const user2 = 'user-456'
      
      // Max out user1
      for (let i = 0; i < 10; i++) {
        await rateLimiter.isAllowed(user1)
      }

      // user1 should be blocked
      let result = await rateLimiter.isAllowed(user1)
      expect(result.allowed).toBe(false)

      // user2 should still be allowed
      result = await rateLimiter.isAllowed(user2)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })
  })

  describe('reset', () => {
    it('should reset limits for an identifier', async () => {
      const identifier = 'user-123'
      
      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed(identifier)
      }

      // Reset
      await rateLimiter.reset(identifier)

      // Should have full quota again
      const result = await rateLimiter.isAllowed(identifier)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })
  })
})

describe('withRateLimit middleware', () => {
  let mockHandler: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    mockHandler = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should allow requests within limit', async () => {
    mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

    const wrappedHandler = withRateLimit(mockHandler, {
      windowMs: 60000,
      maxRequests: 5
    })

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' }
    })

    for (let i = 0; i < 5; i++) {
      const response = await wrappedHandler(request)
      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe(String(4 - i))
    }
  })

  it('should block requests exceeding limit', async () => {
    const wrappedHandler = withRateLimit(mockHandler, {
      windowMs: 60000,
      maxRequests: 2
    })

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' }
    })

    // First 2 requests should succeed
    for (let i = 0; i < 2; i++) {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }))
      await wrappedHandler(request)
    }

    // 3rd request should be rate limited
    const response = await wrappedHandler(request)
    expect(response.status).toBe(429)
    expect(mockHandler).toHaveBeenCalledTimes(2) // Handler not called for rate limited request
    
    const body = await response.json()
    expect(body.error).toContain('Too many requests')
  })

  it('should use IP address as identifier', async () => {
    mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

    const wrappedHandler = withRateLimit(mockHandler, {
      windowMs: 60000,
      maxRequests: 5
    })

    // Different IPs should have separate limits
    const request1 = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' }
    })
    const request2 = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.2' }
    })

    // Max out first IP
    for (let i = 0; i < 5; i++) {
      await wrappedHandler(request1)
    }

    // First IP should be blocked
    let response = await wrappedHandler(request1)
    expect(response.status).toBe(429)

    // Second IP should still work
    response = await wrappedHandler(request2)
    expect(response.status).toBe(200)
  })

  it('should use custom key extractor', async () => {
    mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

    const wrappedHandler = withRateLimit(mockHandler, {
      windowMs: 60000,
      maxRequests: 5,
      keyGenerator: (req) => req.headers.get('user-id') || 'anonymous'
    })

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'user-id': 'user-123' }
    })

    const response = await wrappedHandler(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
  })

  it('should skip rate limiting when configured', async () => {
    mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

    const wrappedHandler = withRateLimit(mockHandler, {
      windowMs: 60000,
      maxRequests: 1,
      skip: (req) => req.headers.get('api-key') === 'special-key'
    })

    // Regular request should be rate limited after 1 request
    const regularRequest = new NextRequest('http://localhost:3000/api/test')
    await wrappedHandler(regularRequest)
    let response = await wrappedHandler(regularRequest)
    expect(response.status).toBe(429)

    // Special request should bypass rate limiting
    const specialRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'api-key': 'special-key' }
    })
    
    for (let i = 0; i < 10; i++) {
      response = await wrappedHandler(specialRequest)
      expect(response.status).toBe(200)
    }
  })
})