import Redis from 'ioredis'
import { RateLimiter } from './rate-limiter'

export interface RedisRateLimitConfig {
  redisUrl?: string
  redisHost?: string
  redisPort?: number
  redisPassword?: string
  maxRequests?: number
  windowMs?: number
  keyPrefix?: string
}

export class RedisRateLimiter implements RateLimiter {
  private redis: Redis
  private maxRequests: number
  private windowMs: number
  private keyPrefix: string

  constructor(config: RedisRateLimitConfig = {}) {
    // Initialize Redis client
    if (config.redisUrl) {
      this.redis = new Redis(config.redisUrl)
    } else {
      this.redis = new Redis({
        host: config.redisHost || process.env.REDIS_HOST || 'localhost',
        port: config.redisPort || parseInt(process.env.REDIS_PORT || '6379'),
        password: config.redisPassword || process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        }
      })
    }

    this.maxRequests = config.maxRequests || 100
    this.windowMs = config.windowMs || 60000 // 1 minute default
    this.keyPrefix = config.keyPrefix || 'rate_limit:'

    // Handle Redis errors
    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `${this.keyPrefix}${identifier}`
    const now = Date.now()
    const windowStart = now - this.windowMs

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()
      
      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, '-inf', windowStart)
      
      // Count requests in current window
      pipeline.zcard(key)
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`)
      
      // Set expiry
      pipeline.expire(key, Math.ceil(this.windowMs / 1000))
      
      const results = await pipeline.exec()
      
      if (!results) {
        throw new Error('Redis pipeline execution failed')
      }

      const count = (results[1][1] as number) || 0
      const allowed = count < this.maxRequests
      const remaining = Math.max(0, this.maxRequests - count - 1)
      const resetAt = new Date(now + this.windowMs)

      // If not allowed, remove the request we just added
      if (!allowed && results[2][0] === null) {
        await this.redis.zrem(key, `${now}-${Math.random()}`)
      }

      return { allowed, remaining, resetAt }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail open - allow request if Redis is down
      return { 
        allowed: true, 
        remaining: this.maxRequests, 
        resetAt: new Date(Date.now() + this.windowMs) 
      }
    }
  }

  async reset(identifier: string): Promise<void> {
    const key = `${this.keyPrefix}${identifier}`
    await this.redis.del(key)
  }

  async getRemainingRequests(identifier: string): Promise<number> {
    const key = `${this.keyPrefix}${identifier}`
    const now = Date.now()
    const windowStart = now - this.windowMs

    try {
      // Remove old entries and count current ones
      await this.redis.zremrangebyscore(key, '-inf', windowStart)
      const count = await this.redis.zcard(key)
      return Math.max(0, this.maxRequests - count)
    } catch (error) {
      console.error('Failed to get remaining requests:', error)
      return this.maxRequests
    }
  }

  async getResetTime(identifier: string): Promise<Date> {
    const key = `${this.keyPrefix}${identifier}`
    
    try {
      // Get the oldest entry in the current window
      const oldestEntries = await this.redis.zrange(key, 0, 0, 'WITHSCORES')
      
      if (oldestEntries.length >= 2) {
        const oldestTimestamp = parseInt(oldestEntries[1])
        return new Date(oldestTimestamp + this.windowMs)
      }
    } catch (error) {
      console.error('Failed to get reset time:', error)
    }

    return new Date(Date.now() + this.windowMs)
  }

  async close(): Promise<void> {
    await this.redis.quit()
  }

  // Helper method to get current window stats
  async getStats(identifier: string): Promise<{
    requests: number
    remaining: number
    resetAt: Date
    windowMs: number
    maxRequests: number
  }> {
    const key = `${this.keyPrefix}${identifier}`
    const now = Date.now()
    const windowStart = now - this.windowMs

    try {
      await this.redis.zremrangebyscore(key, '-inf', windowStart)
      const requests = await this.redis.zcard(key)
      const remaining = Math.max(0, this.maxRequests - requests)
      const resetAt = await this.getResetTime(identifier)

      return {
        requests,
        remaining,
        resetAt,
        windowMs: this.windowMs,
        maxRequests: this.maxRequests
      }
    } catch (error) {
      console.error('Failed to get stats:', error)
      return {
        requests: 0,
        remaining: this.maxRequests,
        resetAt: new Date(Date.now() + this.windowMs),
        windowMs: this.windowMs,
        maxRequests: this.maxRequests
      }
    }
  }
}

// Factory function for easy initialization
export function createRedisRateLimiter(config?: RedisRateLimitConfig): RedisRateLimiter {
  return new RedisRateLimiter(config)
}

// Middleware for Next.js API routes
export function withRedisRateLimit(
  handler: Function,
  config?: RedisRateLimitConfig & { 
    getIdentifier?: (req: any) => string
    onRateLimitExceeded?: (req: any, res: any) => void 
  }
) {
  const limiter = new RedisRateLimiter(config)
  
  return async (req: any, res: any) => {
    const identifier = config?.getIdentifier 
      ? config.getIdentifier(req)
      : req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'

    const { allowed, remaining, resetAt } = await limiter.checkLimit(identifier)

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config?.maxRequests || 100)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', resetAt.toISOString())

    if (!allowed) {
      res.setHeader('Retry-After', Math.ceil((resetAt.getTime() - Date.now()) / 1000))
      
      if (config?.onRateLimitExceeded) {
        return config.onRateLimitExceeded(req, res)
      }
      
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: resetAt
      })
    }

    return handler(req, res)
  }
}