/**
 * Self-Healing System
 * Main entry point for initializing and managing the self-healing system
 */

import { GlobalErrorHandler } from "./global-error-handler";
import {
  HealthCheckRegistry,
  HealthMonitorService,
  registerBuiltInHealthChecks,
} from "./health-monitor";
import { CircuitBreakerRegistry } from "./circuit-breaker";
import { FallbackStrategyRegistry } from "./fallback-strategies";
import { RecoveryOrchestrator } from "./recovery-orchestrator";
import { PredictiveMonitor } from "./predictive-monitor";
import { getDb } from "../../db";
import { failureEvents } from "../../../drizzle/self-healing-schema";
import { nanoid } from "nanoid";

/**
 * Self-Healing System Manager
 * Coordinates all self-healing components
 */
export class SelfHealingSystem {
  private static instance: SelfHealingSystem;
  private isInitialized = false;
  private globalErrorHandler: GlobalErrorHandler;
  private healthMonitor: HealthMonitorService;
  private circuitBreakerRegistry: CircuitBreakerRegistry;
  private fallbackRegistry: FallbackStrategyRegistry;
  private recoveryOrchestrator: RecoveryOrchestrator;
  private predictiveMonitor: PredictiveMonitor | null = null;

  private constructor() {
    this.globalErrorHandler = GlobalErrorHandler.getInstance();
    this.healthMonitor = HealthMonitorService.getInstance();
    this.circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();
    this.fallbackRegistry = FallbackStrategyRegistry.getInstance();
    this.recoveryOrchestrator = RecoveryOrchestrator.getInstance();
  }

  static getInstance(): SelfHealingSystem {
    if (!SelfHealingSystem.instance) {
      SelfHealingSystem.instance = new SelfHealingSystem();
    }
    return SelfHealingSystem.instance;
  }

  /**
   * Initialize the self-healing system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn("[SelfHealing] Already initialized");
      return;
    }

    console.log("[SelfHealing] Initializing self-healing system...");

    try {
      // Initialize global error handler
      this.globalErrorHandler.initialize();

      // Register error handler to log failures to database
      this.globalErrorHandler.registerHandler(async (context) => {
        await this.logFailureToDatabase(context);
      });

      // Register built-in health checks
      registerBuiltInHealthChecks();

      // Start health monitoring
      this.healthMonitor.start();

      // Initialize circuit breakers for critical services
      this.initializeCircuitBreakers();

      // Initialize predictive monitoring (optional, can be enabled later)
      // Uncomment to enable predictive monitoring:
      // this.predictiveMonitor = new PredictiveMonitor();
      // this.predictiveMonitor.start();
      // console.log('[SelfHealing] Predictive monitoring activated');

      this.isInitialized = true;
      console.log("[SelfHealing] Self-healing system initialized successfully");
      console.log("[SelfHealing] - Global error handler: ✓");
      console.log("[SelfHealing] - Health monitoring: ✓");
      console.log("[SelfHealing] - Circuit breakers: ✓");
      console.log("[SelfHealing] - Fallback strategies: ✓");
      console.log("[SelfHealing] - Recovery orchestration: ✓");
      console.log("[SelfHealing] - Predictive monitoring: ⚠️  (disabled, can be enabled)");
    } catch (error) {
      console.error("[SelfHealing] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Shutdown the self-healing system
   */
  shutdown(): void {
    console.log("[SelfHealing] Shutting down self-healing system...");
    this.healthMonitor.stop();
    if (this.predictiveMonitor) {
      this.predictiveMonitor.stop();
    }
    this.isInitialized = false;
  }

  /**
   * Initialize circuit breakers for critical services
   */
  private initializeCircuitBreakers(): void {
    // Gemini AI circuit breaker
    this.circuitBreakerRegistry.getOrCreate("gemini:pro", {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000,
    });

    this.circuitBreakerRegistry.getOrCreate("gemini:flash", {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 15000,
      resetTimeout: 60000,
    });

    // Database circuit breaker
    this.circuitBreakerRegistry.getOrCreate("database", {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 10000,
      resetTimeout: 30000,
    });

    // Storage circuit breaker
    this.circuitBreakerRegistry.getOrCreate("storage:s3", {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 20000,
      resetTimeout: 60000,
    });

    console.log("[SelfHealing] Circuit breakers initialized");
  }

  /**
   * Log failure to database
   */
  private async logFailureToDatabase(context: any): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db.insert(failureEvents).values({
        eventId: context.errorId,
        timestamp: context.timestamp,
        failureCategory: this.categorizeFailure(context.error),
        failureType: context.errorType,
        severity: context.severity,
        affectedService: context.source,
        errorMessage: context.error.message,
        errorStack: context.error.stack,
        context: context.context,
        detectionMethod: "exception",
        userId: context.userId,
        requestId: context.requestId,
        resolved: false,
      });
    } catch (error) {
      console.error("[SelfHealing] Failed to log failure to database:", error);
    }
  }

  /**
   * Categorize failure based on error
   */
  private categorizeFailure(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes("database") || message.includes("sql")) {
      return "database";
    }
    if (message.includes("timeout")) {
      return "timeout";
    }
    if (message.includes("connection")) {
      return "connection";
    }
    if (message.includes("rate limit")) {
      return "rate_limit";
    }
    if (message.includes("memory")) {
      return "memory";
    }

    return "internal_service";
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const registry = HealthCheckRegistry.getInstance();
    return await registry.executeAll();
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates() {
    return this.circuitBreakerRegistry.getAllStates();
  }

  /**
   * Get fallback strategies
   */
  getFallbackStrategies() {
    return this.fallbackRegistry.getAllStrategies();
  }

  /**
   * Get recovery workflows
   */
  getRecoveryWorkflows() {
    return this.recoveryOrchestrator.getAllWorkflows();
  }

  /**
   * Trigger manual recovery
   */
  async triggerRecovery(service: string, trigger: any, context?: Record<string, any>) {
    return await this.recoveryOrchestrator.triggerRecovery(service, trigger, context);
  }

  /**
   * Enable predictive monitoring
   */
  enablePredictiveMonitoring(): void {
    if (this.predictiveMonitor) {
      console.log('[SelfHealing] Predictive monitoring already enabled');
      return;
    }

    this.predictiveMonitor = new PredictiveMonitor();
    this.predictiveMonitor.start();
    console.log('[SelfHealing] Predictive monitoring enabled');
  }

  /**
   * Disable predictive monitoring
   */
  disablePredictiveMonitoring(): void {
    if (!this.predictiveMonitor) {
      console.log('[SelfHealing] Predictive monitoring already disabled');
      return;
    }

    this.predictiveMonitor.stop();
    this.predictiveMonitor = null;
    console.log('[SelfHealing] Predictive monitoring disabled');
  }

  /**
   * Get predictive monitoring status
   */
  getPredictiveMonitoringStatus() {
    return {
      enabled: this.predictiveMonitor !== null,
      status: this.predictiveMonitor ? 'active' : 'disabled'
    };
  }
}

// Export singleton instance
export const selfHealingSystem = SelfHealingSystem.getInstance();

// Export all components
export * from "./global-error-handler";
export * from "./retry-manager";
export * from "./circuit-breaker";
export * from "./health-monitor";
export * from "./fallback-strategies";
export * from "./recovery-orchestrator";
export * from "./predictive-monitor";
