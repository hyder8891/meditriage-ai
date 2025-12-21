/**
 * Redis Connection Validation Test
 * Verifies that REDIS_URL is valid and can connect to Upstash
 */

import { describe, it, expect } from 'vitest';
import Redis from 'ioredis';

describe('Redis Connection', () => {
  it('should connect to Redis using REDIS_URL', async () => {
    // Check if REDIS_URL is set
    expect(process.env.REDIS_URL).toBeDefined();
    expect(process.env.REDIS_URL).toMatch(/^rediss?:\/\//);

    // Create Redis client
    const redis = new Redis(process.env.REDIS_URL!, {
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });

    try {
      // Test connection with PING
      const pong = await redis.ping();
      expect(pong).toBe('PONG');

      // Test SET and GET operations
      const testKey = `test:${Date.now()}`;
      const testValue = 'socket-io-test';
      
      await redis.set(testKey, testValue, 'EX', 10); // Expire in 10 seconds
      const retrievedValue = await redis.get(testKey);
      
      expect(retrievedValue).toBe(testValue);

      // Cleanup
      await redis.del(testKey);

      console.log('✅ Redis connection test passed');
    } finally {
      // Always disconnect
      await redis.quit();
    }
  }, 15000); // 15 second timeout for network operations
});
