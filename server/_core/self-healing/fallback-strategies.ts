/**
 * Fallback Strategy Framework
 * Provides graceful degradation when services fail
 */

export interface FallbackTier {
  priority: number;
  method: 'alternative_provider' | 'cached_data' | 'degraded_mode' | 'static_fallback';
  config: any;
  maxStaleness?: number; // milliseconds
}

export interface FallbackStrategy {
  service: string;
  tiers: FallbackTier[];
  dataIntegrityCheck?: (result: any) => boolean;
  staleDataWarning?: boolean;
  clinicalSafety?: {
    allowCachedData: boolean;
    allowDegradedMode: boolean;
    requiresExplicitFailure: boolean;
  };
}

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  tier: number; // 0 = primary, 1+ = fallback tier
  warning?: string;
  staleness?: number; // milliseconds since data was cached
  usedFallback: boolean;
}

/**
 * Fallback Strategy Registry
 * Manages fallback strategies for all services
 */
export class FallbackStrategyRegistry {
  private static instance: FallbackStrategyRegistry;
  private strategies: Map<string, FallbackStrategy> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private constructor() {
    this.registerDefaultStrategies();
  }

  static getInstance(): FallbackStrategyRegistry {
    if (!FallbackStrategyRegistry.instance) {
      FallbackStrategyRegistry.instance = new FallbackStrategyRegistry();
    }
    return FallbackStrategyRegistry.instance;
  }

  /**
   * Register a fallback strategy
   */
  register(strategy: FallbackStrategy): void {
    this.strategies.set(strategy.service, strategy);
    console.log(`[FallbackStrategy] Registered strategy for: ${strategy.service}`);
  }

  /**
   * Get fallback strategy for a service
   */
  get(service: string): FallbackStrategy | undefined {
    return this.strategies.get(service);
  }

  /**
   * Execute operation with fallback protection
   */
  async executeWithFallback<T>(
    service: string,
    operation: () => Promise<T>,
    context?: { userId?: string; critical?: boolean }
  ): Promise<FallbackResult<T>> {
    const strategy = this.strategies.get(service);

    if (!strategy) {
      // No fallback strategy defined - execute normally
      try {
        const result = await operation();
        return { success: true, data: result, tier: 0, usedFallback: false };
      } catch (error) {
        throw error;
      }
    }

    // Try primary operation first
    try {
      const result = await operation();

      // Cache successful result for future fallback
      this.cacheResult(service, result);

      return { success: true, data: result, tier: 0, usedFallback: false };
    } catch (primaryError) {
      console.warn(
        `[FallbackStrategy] Primary operation failed for ${service}:`,
        primaryError instanceof Error ? primaryError.message : primaryError
      );

      // Try fallback tiers in order
      for (const tier of strategy.tiers) {
        try {
          const fallbackResult = await this.executeFallbackTier<T>(
            service,
            tier,
            strategy
          );

          // Validate data integrity if configured
          if (
            strategy.dataIntegrityCheck &&
            !strategy.dataIntegrityCheck(fallbackResult.data)
          ) {
            console.warn(
              `[FallbackStrategy] Data integrity check failed for tier ${tier.priority}`
            );
            continue; // Try next tier
          }

          return fallbackResult;
        } catch (fallbackError) {
          console.warn(
            `[FallbackStrategy] Fallback tier ${tier.priority} failed:`,
            fallbackError instanceof Error ? fallbackError.message : fallbackError
          );
          // Continue to next tier
        }
      }

      // All fallbacks failed
      throw new Error(
        `All fallback tiers failed for service: ${service}. Primary error: ${
          primaryError instanceof Error ? primaryError.message : primaryError
        }`
      );
    }
  }

  /**
   * Execute a specific fallback tier
   */
  private async executeFallbackTier<T>(
    service: string,
    tier: FallbackTier,
    strategy: FallbackStrategy
  ): Promise<FallbackResult<T>> {
    console.log(
      `[FallbackStrategy] Executing fallback tier ${tier.priority} (${tier.method}) for ${service}`
    );

    switch (tier.method) {
      case "cached_data":
        return await this.getCachedData<T>(service, tier, strategy);

      case "alternative_provider":
        return await this.useAlternativeProvider<T>(service, tier);

      case "degraded_mode":
        return await this.useDegradedMode<T>(service, tier);

      case "static_fallback":
        return await this.useStaticFallback<T>(service, tier);

      default:
        throw new Error(`Unknown fallback method: ${tier.method}`);
    }
  }

  /**
   * Get cached data as fallback
   */
  private async getCachedData<T>(
    service: string,
    tier: FallbackTier,
    strategy: FallbackStrategy
  ): Promise<FallbackResult<T>> {
    const cached = this.cache.get(service);

    if (!cached) {
      throw new Error(`No cached data available for ${service}`);
    }

    const staleness = Date.now() - cached.timestamp;

    // Check if data is too stale
    if (tier.maxStaleness && staleness > tier.maxStaleness) {
      throw new Error(
        `Cached data too stale (${staleness}ms > ${tier.maxStaleness}ms)`
      );
    }

    return {
      success: true,
      data: cached.data,
      tier: tier.priority,
      warning: strategy.staleDataWarning
        ? `Using cached data (${Math.round(staleness / 1000)}s old)`
        : undefined,
      staleness,
      usedFallback: true,
    };
  }

  /**
   * Use alternative provider as fallback
   */
  private async useAlternativeProvider<T>(
    service: string,
    tier: FallbackTier
  ): Promise<FallbackResult<T>> {
    // This would integrate with actual alternative providers
    // For now, throw to indicate not implemented
    throw new Error(`Alternative provider not configured for ${service}`);
  }

  /**
   * Use degraded mode as fallback
   */
  private async useDegradedMode<T>(
    service: string,
    tier: FallbackTier
  ): Promise<FallbackResult<T>> {
    // Return degraded response based on configuration
    const degradedResponse = tier.config.response || {
      message: "Service operating in degraded mode",
    };

    return {
      success: true,
      data: degradedResponse as T,
      tier: tier.priority,
      warning: "Service operating in degraded mode",
      usedFallback: true,
    };
  }

  /**
   * Use static fallback response
   */
  private async useStaticFallback<T>(
    service: string,
    tier: FallbackTier
  ): Promise<FallbackResult<T>> {
    const staticResponse = tier.config.response;

    if (!staticResponse) {
      throw new Error(`No static response configured for ${service}`);
    }

    return {
      success: true,
      data: staticResponse as T,
      tier: tier.priority,
      warning: "Using static fallback response",
      usedFallback: true,
    };
  }

  /**
   * Cache result for future fallback
   */
  private cacheResult(service: string, data: any): void {
    this.cache.set(service, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache for a service
   */
  clearCache(service: string): void {
    this.cache.delete(service);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
  }

  /**
   * Register default fallback strategies
   */
  private registerDefaultStrategies(): void {
    // Clinical Reasoning - Can use alternative providers and cached data
    this.register({
      service: "clinical_reasoning",
      tiers: [
        {
          priority: 1,
          method: "cached_data",
          config: {},
          maxStaleness: 300000, // 5 minutes
        },
        {
          priority: 2,
          method: "degraded_mode",
          config: {
            response: {
              message:
                "AI diagnostic service temporarily unavailable. Please consult with a physician.",
              degraded: true,
            },
          },
        },
      ],
      staleDataWarning: true,
      dataIntegrityCheck: (result) => result && typeof result === "object",
      clinicalSafety: {
        allowCachedData: true,
        allowDegradedMode: true,
        requiresExplicitFailure: false,
      },
    });

    // Drug Interaction - CRITICAL - No cached data allowed
    this.register({
      service: "pharmaguard",
      tiers: [
        {
          priority: 1,
          method: "static_fallback",
          config: {
            response: {
              warning:
                "Drug interaction service temporarily unavailable. Please consult a pharmacist before administering medications.",
              critical: true,
              requiresManualReview: true,
            },
          },
        },
      ],
      clinicalSafety: {
        allowCachedData: false,
        allowDegradedMode: false,
        requiresExplicitFailure: true,
      },
    });

    // Medical Imaging Analysis
    this.register({
      service: "xray_analysis",
      tiers: [
        {
          priority: 1,
          method: "cached_data",
          config: {},
          maxStaleness: 600000, // 10 minutes
        },
        {
          priority: 2,
          method: "degraded_mode",
          config: {
            response: {
              message:
                "AI image analysis unavailable. Image queued for manual radiologist review.",
              queuedForManualReview: true,
            },
          },
        },
      ],
      staleDataWarning: true,
      clinicalSafety: {
        allowCachedData: true,
        allowDegradedMode: true,
        requiresExplicitFailure: false,
      },
    });

    // Symptom Checker - Can use cached data
    this.register({
      service: "symptom_checker",
      tiers: [
        {
          priority: 1,
          method: "cached_data",
          config: {},
          maxStaleness: 3600000, // 1 hour
        },
        {
          priority: 2,
          method: "static_fallback",
          config: {
            response: {
              message:
                "Symptom checker temporarily unavailable. If experiencing severe symptoms, please seek immediate medical attention.",
            },
          },
        },
      ],
      staleDataWarning: true,
      clinicalSafety: {
        allowCachedData: true,
        allowDegradedMode: true,
        requiresExplicitFailure: false,
      },
    });

    // Care Locator - Non-critical, can use stale data
    this.register({
      service: "care_locator",
      tiers: [
        {
          priority: 1,
          method: "cached_data",
          config: {},
          maxStaleness: 3600000, // 1 hour
        },
        {
          priority: 2,
          method: "static_fallback",
          config: {
            response: {
              message: "Care locator service temporarily unavailable. Please try again later.",
            },
          },
        },
      ],
      staleDataWarning: false, // Location data doesn't change frequently
      clinicalSafety: {
        allowCachedData: true,
        allowDegradedMode: true,
        requiresExplicitFailure: false,
      },
    });

    console.log("[FallbackStrategy] Default strategies registered");
  }

  /**
   * Get all registered strategies
   */
  getAllStrategies(): Map<string, FallbackStrategy> {
    return this.strategies;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    services: string[];
    oldestEntry?: { service: string; age: number };
  } {
    const services = Array.from(this.cache.keys());
    let oldestEntry: { service: string; age: number } | undefined;

    this.cache.forEach((cached, service) => {
      const age = Date.now() - cached.timestamp;
      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = { service, age };
      }
    });

    return {
      totalEntries: this.cache.size,
      services,
      oldestEntry,
    };
  }
}

/**
 * Helper function to wrap operations with fallback protection
 */
export async function withFallback<T>(
  service: string,
  operation: () => Promise<T>,
  context?: { userId?: string; critical?: boolean }
): Promise<FallbackResult<T>> {
  const registry = FallbackStrategyRegistry.getInstance();
  return await registry.executeWithFallback(service, operation, context);
}

// Export singleton instance
export const fallbackRegistry = FallbackStrategyRegistry.getInstance();
