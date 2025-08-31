export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

export interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
  keyGenerator?: (request: any) => string
  skip?: (request: any) => boolean
  message?: string
  useRedis?: boolean
  redis?: {
    host?: string
    port?: number
    password?: string
    db?: number
  }
}