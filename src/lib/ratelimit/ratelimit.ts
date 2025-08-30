import { NextRequest, NextResponse } from 'next/server'
import { RateLimitResult } from './types'
import { RedisRateLimiter, createRateLimiter } from './redis-limiter'

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key extraction
  skip?: (request: NextRequest) => boolean // Skip rate limiting for certain requests
  message?: string // Custom error message
  useRedis?: boolean // Use Redis for distributed rate limiting
  redis?: { // Redis configuration
    host?: string
    port?: number
    password?: string
    db?: number
  }
}

export { RateLimitResult } from './types'

interface RateLimitEntry {
  count: number
  resetAt: Date
}

/**
 * In-memory rate limiter
 * Note: In production, use Redis for distributed rate limiting
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(options: Pick<RateLimitOptions, 'windowMs' | 'maxRequests'>) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    
    // Clean up expired entries periodically
    this.startCleanup()
  }

  async isAllowed(identifier: string): Promise<RateLimitResult> {
    const now = new Date()
    const entry = this.limits.get(identifier)

    if (!entry || entry.resetAt <= now) {
      // Create new entry or reset expired one
      const resetAt = new Date(now.getTime() + this.windowMs)
      this.limits.set(identifier, {
        count: 1,
        resetAt
      })

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
        limit: this.maxRequests
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        limit: this.maxRequests
      }
    }

    // Increment count
    entry.count++
    
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
      limit: this.maxRequests
    }
  }

  async reset(identifier: string): Promise<void> {
    this.limits.delete(identifier)
  }

  private startCleanup() {
    // Clean up expired entries every minute
    const interval = setInterval(() => {
      const now = new Date()
      for (const [key, entry] of this.limits.entries()) {
        if (entry.resetAt <= now) {
          this.limits.delete(key)
        }
      }
    }, 60000)

    // Allow cleanup to be stopped in tests
    if (typeof interval.unref === 'function') {
      interval.unref()
    }
  }
}

// Global rate limiter instances
const rateLimiters = new Map<string, RateLimiter | RedisRateLimiter>()
const redisLimiters = new Map<string, RedisRateLimiter>()

/**
 * Get or create a rate limiter instance
 */
function getRateLimiter(
  key: string, 
  options: Pick<RateLimitOptions, 'windowMs' | 'maxRequests' | 'useRedis' | 'redis'>
): RateLimiter | RedisRateLimiter {
  const cacheKey = `${key}-${options.windowMs}-${options.maxRequests}`
  
  // Check if Redis should be used
  if (options.useRedis || options.redis || process.env.REDIS_URL) {
    if (!redisLimiters.has(cacheKey)) {
      const redisLimiter = createRateLimiter({
        windowMs: options.windowMs,
        maxRequests: options.maxRequests,
        redis: options.redis
      })
      
      if (redisLimiter) {
        redisLimiters.set(cacheKey, redisLimiter)
        return redisLimiter
      }
    } else {
      return redisLimiters.get(cacheKey)!
    }
  }
  
  // Fall back to in-memory rate limiter
  if (!rateLimiters.has(cacheKey)) {
    rateLimiters.set(cacheKey, new RateLimiter(options))
  }
  
  return rateLimiters.get(cacheKey)!
}

/**
 * Extract client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default identifier
  // In production, this should be more sophisticated
  return 'default-client'
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions
): (request: NextRequest) => Promise<NextResponse> {
  const {
    windowMs = 60000, // 1 minute default
    maxRequests = 60, // 60 requests per minute default
    keyGenerator = getClientIdentifier,
    skip,
    message = 'Too many requests, please try again later.',
    useRedis,
    redis
  } = options

  const limiter = getRateLimiter('api', { windowMs, maxRequests, useRedis, redis })

  return async (request: NextRequest): Promise<NextResponse> => {
    // Check if rate limiting should be skipped
    if (skip && skip(request)) {
      return handler(request)
    }

    // Get client identifier
    const identifier = keyGenerator(request)
    
    // Check rate limit
    const result = await limiter.isAllowed(identifier)

    // Create response with rate limit headers
    const addRateLimitHeaders = (response: NextResponse): NextResponse => {
      response.headers.set('X-RateLimit-Limit', String(result.limit))
      response.headers.set('X-RateLimit-Remaining', String(result.remaining))
      
      if (result.resetAt) {
        response.headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt.getTime() / 1000)))
      }

      return response
    }

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: message },
        { status: 429 }
      )
      
      if (result.resetAt) {
        response.headers.set('Retry-After', String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)))
      }

      return addRateLimitHeaders(response)
    }

    // Call handler and add rate limit headers to response
    const response = await handler(request)
    return addRateLimitHeaders(response)
  }
}

/**
 * Create rate limiter with different limits for different endpoints
 */
export function createEndpointRateLimiter(configs: Record<string, RateLimitOptions>) {
  return (endpoint: string) => {
    const config = configs[endpoint] || configs.default || {
      windowMs: 60000,
      maxRequests: 60
    }

    return withRateLimit
  }
}

/**
 * Rate limit configurations for different tiers
 */
export const RATE_LIMIT_TIERS = {
  free: {
    windowMs: 60000, // 1 minute
    maxRequests: 10  // 10 requests per minute
  },
  pro: {
    windowMs: 60000, // 1 minute
    maxRequests: 60  // 60 requests per minute
  },
  enterprise: {
    windowMs: 60000,  // 1 minute
    maxRequests: 600  // 600 requests per minute
  }
}

/**
 * Rate limit by API key tier
 */
export function withTieredRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  getTier: (request: NextRequest) => keyof typeof RATE_LIMIT_TIERS | null
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const tier = getTier(request) || 'free'
    const config = RATE_LIMIT_TIERS[tier]
    
    const rateLimitedHandler = withRateLimit(handler, config)
    return rateLimitedHandler(request)
  }
}