import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max unique tokens per interval
}

export class RateLimiter {
  private tokenCache: LRUCache<string, number[]>

  constructor(options: RateLimitOptions = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500 // 500 unique tokens per minute
  }) {
    this.tokenCache = new LRUCache<string, number[]>({
      max: options.uniqueTokenPerInterval,
      ttl: options.interval
    })
  }

  async check(
    request: NextRequest,
    limit: number = 10 // Requests per interval
  ): Promise<{ success: boolean; remaining: number }> {
    const identifier = this.getIdentifier(request)
    const now = Date.now()
    
    const timestamps = this.tokenCache.get(identifier) || []
    const recentTimestamps = timestamps.filter(
      ts => ts > now - (this.tokenCache.ttl as number)
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