import Redis from "ioredis";

// Reuse existing REDIS_URL from environment
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Track Redis health status
let redisHealthy = true;
let lastHealthCheck = Date.now();
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds

// Redis connection event handlers
redis.on("error", (error) => {
  console.error("[RateLimit] Redis connection error:", error.message);
  redisHealthy = false;
});

redis.on("connect", () => {
  console.log("[RateLimit] Redis connected successfully");
  redisHealthy = true;
});

redis.on("ready", () => {
  console.log("[RateLimit] Redis ready");
  redisHealthy = true;
});

redis.on("close", () => {
  console.warn("[RateLimit] Redis connection closed");
  redisHealthy = false;
});

redis.on("reconnecting", () => {
  console.log("[RateLimit] Redis reconnecting...");
});

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
    
    // FAIL OPEN: Redis errors should not block user access
    // Log the error and allow the request to proceed
    console.error(
      `[RateLimit] ⚠️ FAIL OPEN: Redis error for ${action}:${identifier}, allowing request to proceed`,
      error
    );
    console.warn(
      `[RateLimit] ⚠️ Rate limiting is currently unavailable - security degraded`
    );
    
    // Mark Redis as unhealthy
    redisHealthy = false;
    
    // Optionally: Send alert to admin (implement notifyOwner if needed)
    // This ensures ops team knows rate limiting is down
    if (Date.now() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = Date.now();
      console.error(
        `[RateLimit] 🚨 ALERT: Redis has been unhealthy for ${HEALTH_CHECK_INTERVAL}ms - rate limiting disabled`
      );
      // TODO: Uncomment when notifyOwner is available
      // notifyOwner({
      //   title: "Rate Limiting Service Down",
      //   content: `Redis is unavailable. Rate limiting is currently disabled. Users can login without rate limit protection.`
      // }).catch(console.error);
    }
    
    // DO NOT throw - allow request to proceed
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
    // Fail gracefully - return zeros if Redis is down
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
    // Fail gracefully - don't throw
  }
}

/**
 * Check Redis health status
 * 
 * @returns Object with health status and details
 */
export async function checkRedisHealth(): Promise<{
  healthy: boolean;
  latency: number | null;
  error: string | null;
}> {
  const startTime = Date.now();
  
  try {
    await redis.ping();
    const latency = Date.now() - startTime;
    
    redisHealthy = true;
    lastHealthCheck = Date.now();
    
    return {
      healthy: true,
      latency,
      error: null,
    };
  } catch (error) {
    redisHealthy = false;
    
    return {
      healthy: false,
      latency: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Redis health status (cached)
 * 
 * @returns Boolean indicating if Redis is healthy
 */
export function isRedisHealthy(): boolean {
  return redisHealthy;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  try {
    await redis.quit();
    console.log("[RateLimit] Redis connection closed gracefully");
  } catch (error) {
    console.error("[RateLimit] Error closing Redis:", error);
    // Force disconnect if graceful quit fails
    redis.disconnect();
  }
}
