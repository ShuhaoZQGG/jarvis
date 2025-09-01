export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export interface RateLimiter {
  checkLimit(identifier: string): Promise<RateLimitResult>
  reset(identifier: string): Promise<void>
  getRemainingRequests(identifier: string): Promise<number>
  getResetTime(identifier: string): Promise<Date>
}