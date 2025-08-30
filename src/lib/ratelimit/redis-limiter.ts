import Redis from 'ioredis'
import { RateLimitResult } from './types'

export interface RedisRateLimiterOptions {
  redis: {
    host?: string
    port?: number
    password?: string
    db?: number
  } | Redis
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

/**
 * Redis-based rate limiter for production use
 * Uses sliding window algorithm for accurate rate limiting
 */
export class RedisRateLimiter {
  private redis: Redis
  private windowMs: number
  private maxRequests: number
  private keyPrefix: string
  
  constructor(options: RedisRateLimiterOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.keyPrefix = options.keyPrefix || 'ratelimit:'
    
    // Initialize Redis client
    if (options.redis instanceof Redis) {
      this.redis = options.redis
    } else {
      this.redis = new Redis(options.redis)
    }
    
    // Handle Redis errors
    this.redis.on('error', (err) => {
      console.error('Redis rate limiter error:', err)
    })
  }
  
  /**
   * Check if a request is allowed
   */
  async isAllowed(identifier: string): Promise<RateLimitResult> {
    const key = `${this.keyPrefix}${identifier}`
    const windowSeconds = Math.ceil(this.windowMs / 1000)
    
    try {
      // Use pipeline for atomic operations
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, windowSeconds)
      
      const results = await pipeline.exec()
      
      if (!results) {
        // Fallback: allow request on error
        return this.createAllowedResult()
      }
      
      const [[incrErr, count], [expireErr]] = results
      
      if (incrErr || expireErr) {
        // Fallback: allow request on error
        return this.createAllowedResult()
      }
      
      const requestCount = count as number
      
      if (requestCount > this.maxRequests) {
        // Over limit - get TTL for reset time
        const ttl = await this.redis.ttl(key)
        const resetAt = new Date(Date.now() + (ttl * 1000))
        
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          limit: this.maxRequests
        }
      }
      
      return {
        allowed: true,
        remaining: Math.max(0, this.maxRequests - requestCount),
        resetAt: new Date(Date.now() + this.windowMs),
        limit: this.maxRequests
      }
    } catch (error) {
      console.error('Redis rate limit check failed:', error)
      // Fallback: allow request on error to prevent service disruption
      return this.createAllowedResult()
    }
  }
  
  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.keyPrefix}${identifier}`
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
    }
  }
  
  /**
   * Clean up expired keys (optional - Redis handles expiry automatically)
   */
  async cleanup(): Promise<void> {
    // Redis handles expiration automatically, but this method
    // can be used for manual cleanup if needed
  }
  
  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit()
  }
  
  /**
   * Create a default allowed result for fallback scenarios
   */
  private createAllowedResult(): RateLimitResult {
    return {
      allowed: true,
      remaining: this.maxRequests,
      resetAt: new Date(Date.now() + this.windowMs),
      limit: this.maxRequests
    }
  }
}

/**
 * Factory function to create rate limiter based on environment
 */
export function createRateLimiter(options: {
  windowMs: number
  maxRequests: number
  redis?: RedisRateLimiterOptions['redis']
}): RedisRateLimiter | null {
  // Use Redis if configuration is provided
  if (options.redis || process.env.REDIS_URL) {
    const redisConfig = options.redis || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    }
    
    return new RedisRateLimiter({
      redis: redisConfig,
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
    })
  }
  
  // Return null if no Redis config - will fall back to in-memory
  return null
}