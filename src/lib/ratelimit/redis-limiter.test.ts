import { RedisRateLimiter } from './redis-limiter'
import Redis from 'ioredis'

// Mock Redis
jest.mock('ioredis')

describe('RedisRateLimiter', () => {
  let mockRedis: jest.Mocked<Redis>
  let limiter: RedisRateLimiter
  
  beforeEach(() => {
    mockRedis = {
      pipeline: jest.fn(),
      expire: jest.fn(),
      incr: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      ttl: jest.fn(),
      on: jest.fn(),
    } as any
    
    ;(Redis as any).mockImplementation(() => mockRedis)
    
    limiter = new RedisRateLimiter({
      redis: {
        host: 'localhost',
        port: 6379,
      },
      windowMs: 60000,
      maxRequests: 10,
    })
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  it('should allow requests within limit', async () => {
    const mockPipeline = {
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], // incr result
        [null, 1], // expire result
      ])
    }
    
    mockRedis.pipeline.mockReturnValue(mockPipeline as any)
    
    const result = await limiter.isAllowed('test-user')
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
    expect(result.limit).toBe(10)
    expect(mockPipeline.incr).toHaveBeenCalledWith('ratelimit:test-user')
    expect(mockPipeline.expire).toHaveBeenCalledWith('ratelimit:test-user', 60)
  })
  
  it('should block requests exceeding limit', async () => {
    const mockPipeline = {
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 11], // incr result - over limit
        [null, 1], // expire result
      ])
    }
    
    mockRedis.pipeline.mockReturnValue(mockPipeline as any)
    mockRedis.ttl.mockResolvedValue(30) // 30 seconds remaining
    
    const result = await limiter.isAllowed('test-user')
    
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.limit).toBe(10)
    expect(result.resetAt).toBeDefined()
  })
  
  it('should reset limits for a specific key', async () => {
    mockRedis.del.mockResolvedValue(1)
    
    await limiter.reset('test-user')
    
    expect(mockRedis.del).toHaveBeenCalledWith('ratelimit:test-user')
  })
  
  it('should handle Redis errors gracefully', async () => {
    const mockPipeline = {
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
    }
    
    mockRedis.pipeline.mockReturnValue(mockPipeline as any)
    
    // Should fall back to allowing the request on error
    const result = await limiter.isAllowed('test-user')
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(10)
  })
  
  it('should use custom key prefix', async () => {
    limiter = new RedisRateLimiter({
      redis: {
        host: 'localhost',
        port: 6379,
      },
      windowMs: 60000,
      maxRequests: 10,
      keyPrefix: 'api:limit:',
    })
    
    const mockPipeline = {
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1],
        [null, 1],
      ])
    }
    
    mockRedis.pipeline.mockReturnValue(mockPipeline as any)
    
    await limiter.isAllowed('test-user')
    
    expect(mockPipeline.incr).toHaveBeenCalledWith('api:limit:test-user')
  })
  
  it('should handle concurrent requests correctly', async () => {
    const mockPipeline = {
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn()
    }
    
    let callCount = 0
    mockPipeline.exec.mockImplementation(() => {
      callCount++
      return Promise.resolve([
        [null, callCount],
        [null, 1],
      ])
    })
    
    mockRedis.pipeline.mockReturnValue(mockPipeline as any)
    
    // Make 5 concurrent requests
    const results = await Promise.all([
      limiter.isAllowed('test-user'),
      limiter.isAllowed('test-user'),
      limiter.isAllowed('test-user'),
      limiter.isAllowed('test-user'),
      limiter.isAllowed('test-user'),
    ])
    
    // All should be allowed and have correct remaining counts
    results.forEach((result, index) => {
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(10 - (index + 1))
    })
  })
})