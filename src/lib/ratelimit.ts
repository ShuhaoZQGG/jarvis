import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, RedisRateLimiter } from './ratelimit/redis-limiter'
import { RateLimitResult } from './ratelimit/types'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(private config: RateLimitConfig) {}

  async isAllowed(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      const resetTime = now + this.config.windowMs
      this.requests.set(identifier, { count: 1, resetTime })
      return { 
        allowed: true, 
        remaining: this.config.maxRequests - 1, 
        resetAt: new Date(resetTime),
        limit: this.config.maxRequests
      }
    }

    if (record.count >= this.config.maxRequests) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt: new Date(record.resetTime),
        limit: this.config.maxRequests
      }
    }

    record.count++
    return { 
      allowed: true, 
      remaining: this.config.maxRequests - record.count, 
      resetAt: new Date(record.resetTime),
      limit: this.config.maxRequests
    }
  }

  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Rate limiter that uses Redis in production, in-memory in development
class HybridRateLimiter {
  private limiter: RedisRateLimiter | InMemoryRateLimiter

  constructor(config: RateLimitConfig) {
    // Try to create Redis rate limiter
    const redisLimiter = createRateLimiter({
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
    })

    if (redisLimiter) {
      this.limiter = redisLimiter
      console.log('Using Redis rate limiter')
    } else {
      this.limiter = new InMemoryRateLimiter(config)
      console.log('Using in-memory rate limiter')
    }
  }

  async check(identifier: string): Promise<RateLimitResult> {
    return this.limiter.isAllowed(identifier)
  }

  cleanup() {
    if (this.limiter instanceof InMemoryRateLimiter) {
      this.limiter.cleanup()
    }
  }
}

const chatRateLimiter = new HybridRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 requests per minute
})

const crawlRateLimiter = new HybridRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 crawls per hour
})

// Cleanup old entries every 5 minutes (only for in-memory)
setInterval(() => {
  chatRateLimiter.cleanup()
  crawlRateLimiter.cleanup()
}, 5 * 60 * 1000)

export async function rateLimitMiddleware(
  request: NextRequest,
  limiter: HybridRateLimiter
): Promise<NextResponse | null> {
  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous'

  const result = await limiter.check(identifier)

  if (!result.allowed) {
    const resetTime = result.resetAt?.getTime() || Date.now() + 60000
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        }
      }
    )
  }

  return null
}

export { chatRateLimiter, crawlRateLimiter }