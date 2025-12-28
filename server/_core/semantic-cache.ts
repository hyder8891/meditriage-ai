/**
 * Semantic Cache for LLM Responses
 * Reduces LLM costs by caching similar queries using semantic similarity
 */

import { InvokeResult } from './llm';
import { createHash } from 'crypto';

interface CacheEntry {
  key: string;
  prompt: string;
  response: InvokeResult;
  timestamp: number;
  hitCount: number;
  metadata?: Record<string, any>;
}

export interface SemanticCacheOptions {
  maxSize?: number;
  ttlMs?: number;
  similarityThreshold?: number;
  enableSemanticMatch?: boolean;
}

/**
 * Semantic Cache for LLM responses
 * Uses exact matching and optional semantic similarity
 */
export class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttlMs: number;
  private similarityThreshold: number;
  private enableSemanticMatch: boolean;
  private hits = 0;
  private misses = 0;

  constructor(options: SemanticCacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttlMs = options.ttlMs || 3600000; // 1 hour default
    this.similarityThreshold = options.similarityThreshold || 0.95;
    this.enableSemanticMatch = options.enableSemanticMatch || false;
  }

  /**
   * Get cached response for a prompt
   */
  async get(prompt: string, metadata?: Record<string, any>): Promise<InvokeResult | null> {
    // Try exact match first (fast path)
    const exactKey = this.hashPrompt(prompt);
    const exactMatch = this.cache.get(exactKey);

    if (exactMatch && !this.isExpired(exactMatch)) {
      exactMatch.hitCount++;
      this.hits++;
      console.log(`[SemanticCache] Exact cache hit for prompt (${exactMatch.hitCount} hits)`);
      return exactMatch.response;
    }

    // Try semantic similarity match (slow path)
    if (this.enableSemanticMatch) {
      const similarMatch = await this.findSimilarEntry(prompt);
      if (similarMatch) {
        similarMatch.hitCount++;
        this.hits++;
        console.log(
          `[SemanticCache] Semantic cache hit for prompt (${similarMatch.hitCount} hits)`
        );
        return similarMatch.response;
      }
    }

    this.misses++;
    return null;
  }

  /**
   * Store response in cache
   */
  async set(
    prompt: string,
    response: InvokeResult,
    metadata?: Record<string, any>
  ): Promise<void> {
    const key = this.hashPrompt(prompt);

    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      key,
      prompt,
      response,
      timestamp: Date.now(),
      hitCount: 0,
      metadata,
    });

    console.log(`[SemanticCache] Cached response for prompt (cache size: ${this.cache.size})`);
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`[SemanticCache] Cleared ${cleared} expired entries`);
    }

    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('[SemanticCache] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests: total,
    };
  }

  /**
   * Hash prompt for exact matching
   */
  private hashPrompt(prompt: string): string {
    // Normalize prompt (lowercase, trim, remove extra whitespace)
    const normalized = prompt.toLowerCase().trim().replace(/\s+/g, ' ');
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  /**
   * Find similar entry using simple text similarity
   * Note: For production, consider using embeddings and vector similarity
   */
  private async findSimilarEntry(prompt: string): Promise<CacheEntry | null> {
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    const normalizedPrompt = prompt.toLowerCase().trim();

    for (const entry of Array.from(this.cache.values())) {
      if (this.isExpired(entry)) continue;

      const similarity = this.calculateTextSimilarity(
        normalizedPrompt,
        entry.prompt.toLowerCase().trim()
      );

      if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   * For production, consider using embeddings (OpenAI, Sentence Transformers)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set(Array.from(words1).filter((x) => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);

    return intersection.size / union.size;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let lowestHitCount = Infinity;

    // Find entry with lowest hit count and oldest timestamp
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (
        entry.hitCount < lowestHitCount ||
        (entry.hitCount === lowestHitCount && entry.timestamp < oldestTime)
      ) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHitCount = entry.hitCount;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[SemanticCache] Evicted LRU entry (hit count: ${lowestHitCount})`);
    }
  }
}

/**
 * Global semantic cache instance
 */
let globalCache: SemanticCache | null = null;

/**
 * Get or create global semantic cache
 */
export function getSemanticCache(options?: SemanticCacheOptions): SemanticCache {
  if (!globalCache) {
    globalCache = new SemanticCache(options);

    // Clear expired entries every 5 minutes
    setInterval(() => {
      globalCache?.clearExpired();
    }, 300000);
  }

  return globalCache;
}

/**
 * Wrapper function to use cache with LLM calls
 */
export async function cachedLLMCall<T>(
  cacheKey: string,
  fn: () => Promise<InvokeResult>,
  options?: {
    cache?: SemanticCache;
    ttlMs?: number;
    metadata?: Record<string, any>;
  }
): Promise<InvokeResult> {
  const cache = options?.cache || getSemanticCache({ ttlMs: options?.ttlMs });

  // Try cache first
  const cached = await cache.get(cacheKey, options?.metadata);
  if (cached) {
    return cached;
  }

  // Cache miss - call function
  const result = await fn();

  // Store in cache
  await cache.set(cacheKey, result, options?.metadata);

  return result;
}
