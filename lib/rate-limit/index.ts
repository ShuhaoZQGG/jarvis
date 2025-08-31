import { Redis } from 'ioredis';
import { headers } from 'next/headers';

export interface RateLimitConfig {
  interval: number; // Time window in seconds
  limit: number; // Max requests per interval
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Rate limit tiers
export const RATE_LIMIT_TIERS = {
  free: {
    interval: 60, // 1 minute
    limit: 10,
  },
  pro: {
    interval: 60,
    limit: 100,
  },
  enterprise: {
    interval: 60,
    limit: 1000,
  },
} as const;

// Create Redis client (lazy initialization)
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('Redis URL not configured, rate limiting disabled');
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
      });

      redis.on('error', (err) => {
        console.error('Redis error:', err);
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  return redis;
}

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_TIERS.free
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  
  // If Redis is not available, allow all requests (fail open)
  if (!redis) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Date.now() + config.interval * 1000,
    };
  }

  try {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const window = Math.floor(now / (config.interval * 1000));
    const windowKey = `${key}:${window}`;

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, config.interval);
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const count = results[0][1] as number;
    const remaining = Math.max(0, config.limit - count);
    const reset = (window + 1) * config.interval * 1000;

    return {
      success: count <= config.limit,
      limit: config.limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Date.now() + config.interval * 1000,
    };
  }
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request): string {
  const headersList = headers();
  
  // Try to get IP from various headers (for proxied requests)
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0].trim() || 
             realIp || 
             cfConnectingIp || 
             'unknown';
  
  // You could also use user ID if authenticated
  // const userId = await getUserId(request);
  // if (userId) return `user:${userId}`;
  
  return `ip:${ip}`;
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: Request,
  config?: RateLimitConfig
): Promise<Response | null> {
  const identifier = getRateLimitIdentifier(request);
  const result = await checkRateLimit(identifier, config);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  return null;
}

/**
 * Reset rate limit for an identifier (useful for testing)
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
  const redis = getRedisClient();
  
  if (!redis) {
    return false;
  }

  try {
    const pattern = `rate_limit:${identifier}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    return false;
  }
}