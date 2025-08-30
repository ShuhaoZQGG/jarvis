import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(private config: RateLimitConfig) {}

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      const resetTime = now + this.config.windowMs
      this.requests.set(identifier, { count: 1, resetTime })
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime }
    }

    if (record.count >= this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    return { 
      allowed: true, 
      remaining: this.config.maxRequests - record.count, 
      resetTime: record.resetTime 
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

const chatRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 requests per minute
})

const crawlRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 crawls per hour
})

// Cleanup old entries every 5 minutes
setInterval(() => {
  chatRateLimiter.cleanup()
  crawlRateLimiter.cleanup()
}, 5 * 60 * 1000)

export function rateLimitMiddleware(
  request: NextRequest,
  limiter: RateLimiter
): NextResponse | null {
  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous'

  const { allowed, remaining, resetTime } = limiter.check(identifier)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
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