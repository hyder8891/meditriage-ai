/**
 * Circuit Breaker
 * Prevents cascading failures by temporarily blocking requests to failing services
 */

import { getDb } from "../../db";
import { circuitBreakerStates } from "../../../drizzle/self-healing-schema";
import { eq } from "drizzle-orm";

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes before closing from half-open
  timeout: number; // Request timeout in ms
  resetTimeout: number; // Time to wait before trying half-open in ms
}

export type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreakerError extends Error {
  constructor(circuitName: string, nextRetryTime?: number) {
    const message = nextRetryTime
      ? `Circuit breaker '${circuitName}' is open. Retry after ${new Date(nextRetryTime).toISOString()}`
      : `Circuit breaker '${circuitName}' is open`;
    super(message);
    this.name = "CircuitBreakerError";
  }
}

/**
 * Circuit Breaker
 * Prevents cascading failures by temporarily blocking requests to failing services
 */
export class CircuitBreaker {
  private circuitName: string;
  private config: CircuitBreakerConfig;
  private state: CircuitState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private nextRetryTime: number | null = null;
  private lastStateChange: number = Date.now();

  constructor(circuitName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.circuitName = circuitName;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 30000,
      resetTimeout: config.resetTimeout || 60000,
    };

    // Load state from database
    this.loadState().catch((err) =>
      console.error(`[CircuitBreaker:${circuitName}] Failed to load state:`, err)
    );
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === "open") {
      if (this.nextRetryTime && Date.now() < this.nextRetryTime) {
        throw new CircuitBreakerError(this.circuitName, this.nextRetryTime);
      }
      // Time to try half-open
      await this.transitionToHalfOpen();
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        this.timeoutPromise<T>(this.config.timeout),
      ]);

      await this.recordSuccess();
      return result;
    } catch (error) {
      await this.recordFailure();
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  private async recordSuccess(): Promise<void> {
    if (this.state === "half_open") {
      this.successCount++;
      console.log(
        `[CircuitBreaker:${this.circuitName}] Success in half-open state (${this.successCount}/${this.config.successThreshold})`
      );

      if (this.successCount >= this.config.successThreshold) {
        await this.transitionToClosed();
      }
    } else if (this.state === "closed") {
      // Reset failure count on success
      if (this.failureCount > 0) {
        this.failureCount = 0;
        await this.persistState();
      }
    }
  }

  /**
   * Record failed execution
   */
  private async recordFailure(): Promise<void> {
    this.failureCount++;

    console.log(
      `[CircuitBreaker:${this.circuitName}] Failure recorded (${this.failureCount}/${this.config.failureThreshold})`
    );

    if (this.state === "half_open") {
      // Failure in half-open state immediately reopens circuit
      console.warn(
        `[CircuitBreaker:${this.circuitName}] Failure in half-open state, reopening circuit`
      );
      await this.transitionToOpen();
    } else if (
      this.state === "closed" &&
      this.failureCount >= this.config.failureThreshold
    ) {
      console.warn(
        `[CircuitBreaker:${this.circuitName}] Failure threshold reached, opening circuit`
      );
      await this.transitionToOpen();
    }

    await this.persistState();
  }

  /**
   * Transition to CLOSED state
   */
  private async transitionToClosed(): Promise<void> {
    console.log(`[CircuitBreaker:${this.circuitName}] Transitioning to CLOSED`);
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.nextRetryTime = null;
    this.lastStateChange = Date.now();
    await this.persistState();
  }

  /**
   * Transition to OPEN state
   */
  private async transitionToOpen(): Promise<void> {
    console.log(`[CircuitBreaker:${this.circuitName}] Transitioning to OPEN`);
    this.state = "open";
    this.successCount = 0;
    this.nextRetryTime = Date.now() + this.config.resetTimeout;
    this.lastStateChange = Date.now();
    await this.persistState();
  }

  /**
   * Transition to HALF_OPEN state
   */
  private async transitionToHalfOpen(): Promise<void> {
    console.log(`[CircuitBreaker:${this.circuitName}] Transitioning to HALF_OPEN`);
    this.state = "half_open";
    this.successCount = 0;
    this.failureCount = 0;
    this.lastStateChange = Date.now();
    await this.persistState();
  }

  /**
   * Create timeout promise
   */
  private timeoutPromise<T>(ms: number): Promise<T> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Circuit breaker timeout after ${ms}ms`)),
        ms
      )
    );
  }

  /**
   * Load circuit breaker state from database
   */
  private async loadState(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      const [record] = await db
        .select()
        .from(circuitBreakerStates)
        .where(eq(circuitBreakerStates.circuitName, this.circuitName))
        .limit(1);

      if (record) {
        this.state = record.state as CircuitState;
        this.failureCount = record.failureCount;
        this.successCount = record.successCount;
        this.nextRetryTime = record.nextRetryAt
          ? new Date(record.nextRetryAt).getTime()
          : null;

        console.log(
          `[CircuitBreaker:${this.circuitName}] Loaded state: ${this.state}`
        );
      }
    } catch (error) {
      console.error(
        `[CircuitBreaker:${this.circuitName}] Failed to load state:`,
        error
      );
    }
  }

  /**
   * Persist circuit breaker state to database
   */
  private async persistState(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db
        .insert(circuitBreakerStates)
        .values({
          circuitName: this.circuitName,
          state: this.state,
          failureCount: this.failureCount,
          successCount: this.successCount,
          lastFailureAt: this.failureCount > 0 ? new Date() : null,
          lastSuccessAt: this.successCount > 0 ? new Date() : null,
          openedAt: this.state === "open" ? new Date() : null,
          nextRetryAt: this.nextRetryTime ? new Date(this.nextRetryTime) : null,
          configuration: this.config,
          updatedAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureAt: this.failureCount > 0 ? new Date() : null,
            lastSuccessAt: this.successCount > 0 ? new Date() : null,
            openedAt: this.state === "open" ? new Date() : null,
            nextRetryAt: this.nextRetryTime ? new Date(this.nextRetryTime) : null,
            configuration: this.config,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error(
        `[CircuitBreaker:${this.circuitName}] Failed to persist state:`,
        error
      );
    }
  }

  /**
   * Get current circuit state
   */
  getState(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextRetryTime: number | null;
    lastStateChange: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextRetryTime: this.nextRetryTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  async reset(): Promise<void> {
    console.log(`[CircuitBreaker:${this.circuitName}] Manual reset`);
    await this.transitionToClosed();
  }
}

/**
 * Circuit Breaker Registry
 * Manages all circuit breakers in the system
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Array<{
    name: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextRetryTime: number | null;
  }> {
    const states: Array<any> = [];

    this.breakers.forEach((breaker, name) => {
      states.push({
        name,
        ...breaker.getState(),
      });
    });

    return states;
  }
}

/**
 * Wrap a function with circuit breaker protection
 */
export function wrapWithCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  circuitName: string,
  config?: Partial<CircuitBreakerConfig>
): T {
  const registry = CircuitBreakerRegistry.getInstance();
  const breaker = registry.getOrCreate(circuitName, config);

  return (async (...args: any[]) => {
    return await breaker.execute(() => fn(...args));
  }) as T;
}
