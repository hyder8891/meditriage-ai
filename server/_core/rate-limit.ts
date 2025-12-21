import Redis from "ioredis";

// Reuse existing REDIS_URL from environment
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

/**
 * Rate Limiting using Redis
 * 
 * Prevents brute-force attacks by limiting the number of requests
 * a user can make within a time window.
 * 
 * @param identifier - Unique identifier (email, IP, user ID)
 * @param action - Action being rate limited (e.g., "login", "register", "reset-password")
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @throws Error if rate limit exceeded
 */
export async function rateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const key = `ratelimit:${action}:${identifier}`;

  try {
    // Increment the counter
    const current = await redis.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Check if limit exceeded
    if (current > limit) {
      const ttl = await redis.ttl(key);
      throw new Error(
        `Too many ${action} attempts. Please try again in ${ttl} seconds.`
      );
    }

    console.log(
      `[RateLimit] ${action}:${identifier} - ${current}/${limit} (window: ${windowSeconds}s)`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Too many")) {
      throw error; // Re-throw rate limit errors
    }
    // Log Redis errors but don't block the request
    console.error("[RateLimit] Redis error:", error);
  }
}

/**
 * Get current rate limit status for an identifier
 * 
 * @param identifier - Unique identifier
 * @param action - Action being checked
 * @returns Object with current count and TTL
 */
export async function getRateLimitStatus(
  identifier: string,
  action: string
): Promise<{ count: number; ttl: number }> {
  const key = `ratelimit:${action}:${identifier}`;

  try {
    const count = await redis.get(key);
    const ttl = await redis.ttl(key);

    return {
      count: count ? parseInt(count) : 0,
      ttl: ttl > 0 ? ttl : 0,
    };
  } catch (error) {
    console.error("[RateLimit] Error getting status:", error);
    return { count: 0, ttl: 0 };
  }
}

/**
 * Reset rate limit for an identifier (admin override)
 * 
 * @param identifier - Unique identifier
 * @param action - Action to reset
 */
export async function resetRateLimit(
  identifier: string,
  action: string
): Promise<void> {
  const key = `ratelimit:${action}:${identifier}`;

  try {
    await redis.del(key);
    console.log(`[RateLimit] Reset ${action}:${identifier}`);
  } catch (error) {
    console.error("[RateLimit] Error resetting:", error);
  }
}
