/**
 * Recovery Orchestration Engine
 * Coordinates all self-healing components into unified recovery workflows
 */

import { nanoid } from "nanoid";
import { CircuitBreakerRegistry } from "./circuit-breaker";
import { RetryManager } from "./retry-manager";
import { FallbackStrategyRegistry } from "./fallback-strategies";
import { GlobalErrorHandler } from "./global-error-handler";
import { getDb } from "../../db";
import { recoveryActions } from "../../../drizzle/self-healing-schema";

export type RecoveryTrigger =
  | "circuit_open"
  | "health_check_failed"
  | "error_threshold"
  | "anomaly_detected"
  | "manual";

export type RecoveryActionType =
  | "retry"
  | "fallback"
  | "circuit_break"
  | "scale"
  | "restart"
  | "alert"
  | "cache_warm"
  | "reduce_load";

export type RecoveryPriority = "critical" | "high" | "medium" | "low";

export interface RecoveryStep {
  action: RecoveryActionType;
  config: any;
  successCriteria?: (result: any) => boolean;
  failureAction: "continue" | "abort" | "rollback";
  timeout?: number;
}

export interface RecoveryWorkflow {
  id: string;
  trigger: RecoveryTrigger;
  service: string;
  steps: RecoveryStep[];
  rollbackSteps?: RecoveryStep[];
  timeout: number;
  priority: RecoveryPriority;
  metadata?: Record<string, any>;
}

export interface RecoveryResult {
  workflowId: string;
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  duration: number;
  error?: Error;
  results: any[];
  rolledBack: boolean;
}

/**
 * Recovery Orchestrator
 * Manages and executes recovery workflows
 */
export class RecoveryOrchestrator {
  private static instance: RecoveryOrchestrator;
  private workflows: Map<string, RecoveryWorkflow> = new Map();
  private activeRecoveries: Map<string, Promise<RecoveryResult>> = new Map();
  private circuitRegistry: CircuitBreakerRegistry;
  private fallbackRegistry: FallbackStrategyRegistry;

  private constructor() {
    this.circuitRegistry = CircuitBreakerRegistry.getInstance();
    this.fallbackRegistry = FallbackStrategyRegistry.getInstance();
    this.registerDefaultWorkflows();
  }

  static getInstance(): RecoveryOrchestrator {
    if (!RecoveryOrchestrator.instance) {
      RecoveryOrchestrator.instance = new RecoveryOrchestrator();
    }
    return RecoveryOrchestrator.instance;
  }

  /**
   * Register a recovery workflow
   */
  registerWorkflow(workflow: RecoveryWorkflow): void {
    this.workflows.set(workflow.id, workflow);
    console.log(
      `[RecoveryOrchestrator] Registered workflow: ${workflow.id} for ${workflow.service}`
    );
  }

  /**
   * Execute a recovery workflow
   */
  async executeWorkflow(
    workflowId: string,
    context?: Record<string, any>
  ): Promise<RecoveryResult> {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Check if recovery is already in progress for this service
    if (this.activeRecoveries.has(workflow.service)) {
      console.log(
        `[RecoveryOrchestrator] Recovery already in progress for ${workflow.service}`
      );
      return await this.activeRecoveries.get(workflow.service)!;
    }

    // Start recovery
    const recoveryPromise = this.executeWorkflowInternal(workflow, context);
    this.activeRecoveries.set(workflow.service, recoveryPromise);

    try {
      const result = await recoveryPromise;
      return result;
    } finally {
      this.activeRecoveries.delete(workflow.service);
    }
  }

  /**
   * Internal workflow execution
   */
  private async executeWorkflowInternal(
    workflow: RecoveryWorkflow,
    context?: Record<string, any>
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const results: any[] = [];
    let completedSteps = 0;
    let rolledBack = false;

    console.log(
      `[RecoveryOrchestrator] Starting workflow ${workflow.id} for ${workflow.service}`
    );

    try {
      // Execute steps in sequence
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];

        console.log(
          `[RecoveryOrchestrator] Executing step ${i + 1}/${workflow.steps.length}: ${step.action}`
        );

        try {
          const stepResult = await this.executeStep(
            step,
            workflow.service,
            context
          );
          results.push(stepResult);
          completedSteps++;

          // Check success criteria if defined
          if (step.successCriteria && !step.successCriteria(stepResult)) {
            console.warn(
              `[RecoveryOrchestrator] Step ${i + 1} success criteria not met`
            );

            if (step.failureAction === "abort") {
              throw new Error("Step success criteria not met, aborting workflow");
            } else if (step.failureAction === "rollback") {
              await this.executeRollback(workflow, results);
              rolledBack = true;
              throw new Error("Step success criteria not met, rolled back");
            }
            // Continue to next step if failureAction is 'continue'
          }
        } catch (stepError) {
          console.error(
            `[RecoveryOrchestrator] Step ${i + 1} failed:`,
            stepError
          );

          if (step.failureAction === "abort") {
            throw stepError;
          } else if (step.failureAction === "rollback") {
            await this.executeRollback(workflow, results);
            rolledBack = true;
            throw stepError;
          }
          // Continue to next step if failureAction is 'continue'
        }
      }

      const duration = Date.now() - startTime;

      // Log successful recovery
      await this.logRecoveryAction({
        workflowId: workflow.id,
        service: workflow.service,
        trigger: workflow.trigger,
        success: true,
        completedSteps,
        totalSteps: workflow.steps.length,
        duration,
      });

      console.log(
        `[RecoveryOrchestrator] Workflow ${workflow.id} completed successfully in ${duration}ms`
      );

      return {
        workflowId: workflow.id,
        success: true,
        completedSteps,
        totalSteps: workflow.steps.length,
        duration,
        results,
        rolledBack,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log failed recovery
      await this.logRecoveryAction({
        workflowId: workflow.id,
        service: workflow.service,
        trigger: workflow.trigger,
        success: false,
        completedSteps,
        totalSteps: workflow.steps.length,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      console.error(
        `[RecoveryOrchestrator] Workflow ${workflow.id} failed after ${duration}ms:`,
        error
      );

      return {
        workflowId: workflow.id,
        success: false,
        completedSteps,
        totalSteps: workflow.steps.length,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
        results,
        rolledBack,
      };
    }
  }

  /**
   * Execute a single recovery step
   */
  private async executeStep(
    step: RecoveryStep,
    service: string,
    context?: Record<string, any>
  ): Promise<any> {
    const timeout = step.timeout || 30000; // Default 30 seconds

    const stepPromise = this.executeStepAction(step, service, context);

    // Execute with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Step timeout after ${timeout}ms`)), timeout)
    );

    return await Promise.race([stepPromise, timeoutPromise]);
  }

  /**
   * Execute the actual step action
   */
  private async executeStepAction(
    step: RecoveryStep,
    service: string,
    context?: Record<string, any>
  ): Promise<any> {
    switch (step.action) {
      case "retry":
        return await this.executeRetry(service, step.config);

      case "fallback":
        return await this.executeFallback(service, step.config);

      case "circuit_break":
        return await this.executeCircuitBreak(service, step.config);

      case "alert":
        return await this.executeAlert(service, step.config);

      case "cache_warm":
        return await this.executeCacheWarm(service, step.config);

      default:
        throw new Error(`Unknown recovery action: ${step.action}`);
    }
  }

  /**
   * Execute retry action
   */
  private async executeRetry(service: string, config: any): Promise<any> {
    console.log(`[RecoveryOrchestrator] Executing retry for ${service}`);

    // This would integrate with the actual service operation
    // For now, return success
    return { action: "retry", service, success: true };
  }

  /**
   * Execute fallback action
   */
  private async executeFallback(service: string, config: any): Promise<any> {
    console.log(`[RecoveryOrchestrator] Executing fallback for ${service}`);

    // Get fallback strategy
    const strategy = this.fallbackRegistry.get(service);

    if (!strategy) {
      throw new Error(`No fallback strategy defined for ${service}`);
    }

    return { action: "fallback", service, strategy: strategy.tiers[0].method };
  }

  /**
   * Execute circuit breaker action
   */
  private async executeCircuitBreak(service: string, config: any): Promise<any> {
    console.log(`[RecoveryOrchestrator] Opening circuit breaker for ${service}`);

    const breaker = this.circuitRegistry.get(service);

    if (breaker) {
      // Circuit breaker state is managed automatically
      return { action: "circuit_break", service, state: breaker.getState() };
    }

    return { action: "circuit_break", service, state: "not_configured" };
  }

  /**
   * Execute alert action
   */
  private async executeAlert(service: string, config: any): Promise<any> {
    console.log(
      `[RecoveryOrchestrator] Sending alert for ${service} (severity: ${config.severity})`
    );

    // This would integrate with actual alerting system
    GlobalErrorHandler.getInstance().handleError({
      errorId: nanoid(),
      timestamp: new Date(),
      error: new Error(`Recovery alert for ${service}`),
      errorType: "recovery_alert",
      severity: config.severity || "medium",
      source: "recovery_orchestrator",
      context: { service, config },
    });

    return { action: "alert", service, severity: config.severity };
  }

  /**
   * Execute cache warming action
   */
  private async executeCacheWarm(service: string, config: any): Promise<any> {
    console.log(`[RecoveryOrchestrator] Warming cache for ${service}`);

    // This would integrate with actual cache warming logic
    return { action: "cache_warm", service, ttl: config.ttl };
  }

  /**
   * Execute rollback steps
   */
  private async executeRollback(
    workflow: RecoveryWorkflow,
    results: any[]
  ): Promise<void> {
    if (!workflow.rollbackSteps || workflow.rollbackSteps.length === 0) {
      console.log(`[RecoveryOrchestrator] No rollback steps defined for ${workflow.id}`);
      return;
    }

    console.log(`[RecoveryOrchestrator] Executing rollback for ${workflow.id}`);

    for (const step of workflow.rollbackSteps) {
      try {
        await this.executeStep(step, workflow.service);
      } catch (error) {
        console.error(`[RecoveryOrchestrator] Rollback step failed:`, error);
        // Continue with other rollback steps
      }
    }
  }

  /**
   * Log recovery action to database
   */
  private async logRecoveryAction(data: {
    workflowId: string;
    service: string;
    trigger: RecoveryTrigger;
    success: boolean;
    completedSteps: number;
    totalSteps: number;
    duration: number;
    error?: Error;
  }): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db.insert(recoveryActions).values({
        actionId: nanoid(),
        failureEventId: 0, // Would be linked to actual failure event
        timestamp: new Date(),
        actionType: "workflow",
        actionStrategy: data.workflowId,
        status: data.success ? "succeeded" : "failed",
        automated: true,
        triggeredBy: "system",
        parameters: {
          trigger: data.trigger,
          service: data.service,
          completedSteps: data.completedSteps,
          totalSteps: data.totalSteps,
        },
        result: {
          success: data.success,
          error: data.error?.message,
        },
        durationMs: data.duration,
        completedAt: new Date(),
      });
    } catch (error) {
      console.error("[RecoveryOrchestrator] Failed to log recovery action:", error);
    }
  }

  /**
   * Register default recovery workflows
   */
  private registerDefaultWorkflows(): void {
    // Workflow: AI Service Failure
    this.registerWorkflow({
      id: "ai_service_failure",
      trigger: "circuit_open",
      service: "gemini:pro",
      priority: "high",
      steps: [
        {
          action: "fallback",
          config: { provider: "deepseek" },
          failureAction: "continue",
        },
        {
          action: "cache_warm",
          config: { ttl: 300 },
          failureAction: "continue",
        },
        {
          action: "alert",
          config: { severity: "high", channel: "slack" },
          failureAction: "continue",
        },
      ],
      timeout: 30000,
    });

    // Workflow: Database Connection Lost
    this.registerWorkflow({
      id: "database_connection_lost",
      trigger: "health_check_failed",
      service: "database",
      priority: "critical",
      steps: [
        {
          action: "retry",
          config: { maxAttempts: 3, exponentialBase: 2 },
          failureAction: "continue",
        },
        {
          action: "alert",
          config: { severity: "critical", channel: "pager" },
          failureAction: "continue",
        },
      ],
      timeout: 10000,
    });

    // Workflow: High Error Rate
    this.registerWorkflow({
      id: "high_error_rate",
      trigger: "error_threshold",
      service: "api_server",
      priority: "high",
      steps: [
        {
          action: "circuit_break",
          config: {},
          failureAction: "continue",
        },
        {
          action: "alert",
          config: { severity: "high", channel: "slack" },
          failureAction: "continue",
        },
      ],
      timeout: 5000,
    });

    console.log("[RecoveryOrchestrator] Default workflows registered");
  }

  /**
   * Get all registered workflows
   */
  getAllWorkflows(): Map<string, RecoveryWorkflow> {
    return this.workflows;
  }

  /**
   * Get active recoveries
   */
  getActiveRecoveries(): string[] {
    return Array.from(this.activeRecoveries.keys());
  }

  /**
   * Trigger recovery by service and trigger type
   */
  async triggerRecovery(
    service: string,
    trigger: RecoveryTrigger,
    context?: Record<string, any>
  ): Promise<RecoveryResult | null> {
    // Find matching workflow
    const workflow = Array.from(this.workflows.values()).find(
      (w) => w.service === service && w.trigger === trigger
    );

    if (!workflow) {
      console.warn(
        `[RecoveryOrchestrator] No workflow found for service: ${service}, trigger: ${trigger}`
      );
      return null;
    }

    return await this.executeWorkflow(workflow.id, context);
  }
}

// Export singleton instance
export const recoveryOrchestrator = RecoveryOrchestrator.getInstance();
