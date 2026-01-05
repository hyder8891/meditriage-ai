/**
 * Redis Client Helper for Avicenna-X Brain Modules
 * 
 * Properly initializes Redis connection from REDIS_URL environment variable.
 * The URL format is: rediss://default:PASSWORD@hostname:port
 * 
 * For Upstash Redis, we need to convert this to:
 * - url: https://hostname (without port)
 * - token: PASSWORD (extracted from URL)
 */

import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;
let redisAvailable = true;

/**
 * Parse Redis URL and extract connection parameters
 */
function parseRedisUrl(redisUrl: string): { url: string; token: string } | null {
  try {
    // Format: rediss://default:PASSWORD@hostname:port
    // or: rediss://default:PASSWORD@hostname
    const url = new URL(redisUrl);
    
    // Extract password (token)
    const token = url.password;
    if (!token) {
      console.warn("[Redis] No password found in REDIS_URL");
      return null;
    }
    
    // Build Upstash-compatible URL (https://hostname without port)
    const upstashUrl = `https://${url.hostname}`;
    
    return { url: upstashUrl, token };
  } catch (error) {
    console.error("[Redis] Failed to parse REDIS_URL:", error);
    return null;
  }
}

/**
 * Get or create Redis client instance
 * Returns null if Redis is not configured or unavailable
 */
export function getRedisClient(): Redis | null {
  if (!redisAvailable) {
    return null;
  }
  
  if (redisInstance) {
    return redisInstance;
  }
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL not configured, Redis features disabled");
    redisAvailable = false;
    return null;
  }
  
  const config = parseRedisUrl(redisUrl);
  if (!config) {
    console.warn("[Redis] Failed to parse REDIS_URL, Redis features disabled");
    redisAvailable = false;
    return null;
  }
  
  try {
    redisInstance = new Redis({
      url: config.url,
      token: config.token,
    });
    console.log("[Redis] Client initialized successfully");
    return redisInstance;
  } catch (error) {
    console.error("[Redis] Failed to initialize client:", error);
    redisAvailable = false;
    return null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && getRedisClient() !== null;
}

/**
 * Safe Redis GET with fallback
 */
export async function safeGet<T>(key: string, fallback: T): Promise<T> {
  const redis = getRedisClient();
  if (!redis) return fallback;
  
  try {
    const value = await redis.get(key);
    return value !== null ? (value as T) : fallback;
  } catch (error) {
    console.warn(`[Redis] GET failed for key ${key}:`, error);
    return fallback;
  }
}

/**
 * Safe Redis SET with error handling
 */
export async function safeSet(key: string, value: any, options?: { ex?: number }): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    if (options?.ex) {
      await redis.set(key, value, { ex: options.ex });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    console.warn(`[Redis] SET failed for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis INCR with error handling
 */
export async function safeIncr(key: string): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    return await redis.incr(key);
  } catch (error) {
    console.warn(`[Redis] INCR failed for key ${key}:`, error);
    return null;
  }
}

/**
 * Safe Redis DEL with error handling
 */
export async function safeDel(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn(`[Redis] DEL failed for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis EXPIRE with error handling
 */
export async function safeExpire(key: string, seconds: number): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.expire(key, seconds);
    return true;
  } catch (error) {
    console.warn(`[Redis] EXPIRE failed for key ${key}:`, error);
    return false;
  }
}
