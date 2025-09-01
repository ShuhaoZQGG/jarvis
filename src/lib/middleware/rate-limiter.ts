import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'
import { RedisRateLimiter } from '../rate-limit/redis-rate-limit'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max unique tokens per interval
  useRedis?: boolean // Use Redis if available
}

export class RateLimiter {
  private tokenCache: LRUCache<string, number[]>
  private redisLimiter?: RedisRateLimiter
  private interval: number

  constructor(options: RateLimitOptions = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // 500 unique tokens per minute
    useRedis: process.env.REDIS_URL ? true : false
  }) {
    this.interval = options.interval
    this.tokenCache = new LRUCache<string, number[]>({
      max: options.uniqueTokenPerInterval,
      ttl: options.interval
    })

    // Initialize Redis rate limiter if configured
    if (options.useRedis && (process.env.REDIS_URL || process.env.REDIS_HOST)) {
      try {
        this.redisLimiter = new RedisRateLimiter({
          redisUrl: process.env.REDIS_URL,
          redisHost: process.env.REDIS_HOST,
          redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
          redisPassword: process.env.REDIS_PASSWORD,
          windowMs: options.interval,
          maxRequests: options.uniqueTokenPerInterval
        })
        console.log('Redis rate limiter initialized')
      } catch (error) {
        console.error('Failed to initialize Redis rate limiter, falling back to in-memory:', error)
      }
    }
  }

  async check(
    request: NextRequest,
    limit: number = 10 // Requests per interval
  ): Promise<{ success: boolean; remaining: number }> {
    const identifier = this.getIdentifier(request)

    // Use Redis if available
    if (this.redisLimiter) {
      try {
        const result = await this.redisLimiter.checkLimit(identifier)
        return {
          success: result.allowed,
          remaining: result.remaining
        }
      } catch (error) {
        console.error('Redis rate limit check failed, falling back to in-memory:', error)
        // Fall through to in-memory implementation
      }
    }

    // In-memory fallback
    const now = Date.now()
    const timestamps = this.tokenCache.get(identifier) || []
    const recentTimestamps = timestamps.filter(
      ts => ts > now - this.interval
    )

    if (recentTimestamps.length >= limit) {
      return { success: false, remaining: 0 }
    }

    recentTimestamps.push(now)
    this.tokenCache.set(identifier, recentTimestamps)

    return { 
      success: true, 
      remaining: limit - recentTimestamps.length 
    }
  }

  private getIdentifier(request: NextRequest): string {
    // Use IP address as identifier
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    
    // Include API key if present for better granularity
    const apiKey = request.headers.get('x-api-key')
    
    return apiKey ? `${ip}:${apiKey}` : ip
  }

  static rateLimitResponse(remaining: number = 0): NextResponse {
    return NextResponse.json(
      { 
        error: 'Too many requests', 
        message: 'Please slow down your requests'
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': '60'
        }
      }
    )
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}