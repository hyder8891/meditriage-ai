import Redis from "ioredis";

// Reuse existing REDIS_URL from environment
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Track Redis health status
let redisHealthy = true;
let lastHealthCheck = Date.now();
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds

// In-memory fallback rate limiting when Redis is unavailable
// This provides degraded but still functional rate limiting
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  memoryRateLimits.forEach((value, key) => {
    if (value.expiresAt < now) {
      memoryRateLimits.delete(key);
    }
  });
}, 60000); // Clean up every minute

// Redis connection event handlers
redis.on("error", (error) => {
  console.error("[RateLimit] Redis connection error:", error.message);
  redisHealthy = false;
});

redis.on("connect", () => {
  redisHealthy = true;
});

redis.on("ready", () => {
  redisHealthy = true;
});

redis.on("close", () => {
  console.warn("[RateLimit] Redis connection closed");
  redisHealthy = false;
});

redis.on("reconnecting", () => {
  // Reconnecting silently
});

/**
 * In-memory rate limiting fallback
 * Used when Redis is unavailable to maintain security
 */
function memoryRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): void {
  const key = `ratelimit:${action}:${identifier}`;
  const now = Date.now();
  const entry = memoryRateLimits.get(key);

  if (!entry || entry.expiresAt < now) {
    // First request or expired window
    memoryRateLimits.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return;
  }

  // Increment counter
  entry.count++;

  if (entry.count > limit) {
    const ttl = Math.ceil((entry.expiresAt - now) / 1000);
    throw new Error(
      `Too many ${action} attempts. Please try again in ${ttl} seconds.`
    );
  }
}

/**
 * Rate Limiting using Redis with in-memory fallback
 * 
 * Prevents brute-force attacks by limiting the number of requests
 * a user can make within a time window.
 * 
 * SECURITY: Falls back to in-memory rate limiting when Redis is unavailable
 * to maintain protection against brute-force attacks.
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
  } catch (error) {
    if (error instanceof Error && error.message.includes("Too many")) {
      throw error; // Re-throw rate limit errors
    }
    
    // FAIL CLOSED with in-memory fallback: Redis errors trigger memory-based rate limiting
    // This maintains security while allowing the service to continue operating
    console.warn(
      `[RateLimit] Redis unavailable for ${action}:${identifier}, using in-memory fallback`
    );
    
    // Mark Redis as unhealthy
    redisHealthy = false;
    
    // Use in-memory rate limiting as fallback
    memoryRateLimit(identifier, action, limit, windowSeconds);
    
    // Alert about degraded state (throttled to avoid spam)
    if (Date.now() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = Date.now();
      console.error(
        `[RateLimit] 🚨 ALERT: Redis unavailable - using in-memory rate limiting (degraded security)`
      );
    }
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
  } catch {
    // Check in-memory fallback
    const memEntry = memoryRateLimits.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return {
        count: memEntry.count,
        ttl: Math.ceil((memEntry.expiresAt - Date.now()) / 1000),
      };
    }
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
  } catch {
    // Also clear from memory fallback
  }
  
  // Clear from memory fallback
  memoryRateLimits.delete(key);
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
  } catch {
    // Force disconnect if graceful quit fails
    redis.disconnect();
  }
}
