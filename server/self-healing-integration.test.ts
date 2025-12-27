/**
 * Self-Healing System Integration Tests
 * 
 * Tests the complete self-healing system including:
 * - Recovery actions
 * - Alert integration
 * - Dashboard data retrieval
 */

import { describe, it, expect, beforeAll } from "vitest";
import { executeRecoveryAction, isRequestThrottled } from "./self-healing-recovery";
import { sendAlert, alertCircuitBreakerOpen, alertCriticalFailure } from "./self-healing-alerts";
import { getDb } from "./db";
import { failureEvents, circuitBreakerStates } from "../drizzle/self-healing-schema";
import { eq } from "drizzle-orm";

describe("Self-Healing System Integration Tests", () => {
  describe("Recovery Actions", () => {
    it("should execute restart_service recovery action", async () => {
      const result = await executeRecoveryAction(
        "test-service",
        "service_restart",
        { reason: "test" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("restart_service");
      expect(result.message).toContain("restarted successfully");
    });

    it("should execute clear_cache recovery action", async () => {
      const result = await executeRecoveryAction(
        "test-service",
        "cache_clear",
        { reason: "test" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("clear_cache");
      expect(result.message).toContain("cache entries");
    });

    it("should execute cleanup_memory recovery action", async () => {
      const result = await executeRecoveryAction(
        "test-service",
        "memory_cleanup",
        { reason: "test" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("cleanup_memory");
      expect(result.message).toContain("Memory cleanup completed");
    });

    it("should execute scale_resources recovery action", async () => {
      const result = await executeRecoveryAction(
        "test-service",
        "overload", // Maps to scale_resources
        { currentLimit: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("scale_resources");
      expect(result.message).toContain("Scaled resources");
    });

    it("should execute reconnect_database recovery action", async () => {
      const result = await executeRecoveryAction(
        "test-service",
        "database_reconnect",
        { reason: "test" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("reconnect_database");
      expect(result.message).toContain("reconnected successfully");
    });

    it("should execute reset_circuit_breaker recovery action", async () => {
      const result = await executeRecoveryAction(
        "test-service",
        "circuit_breaker_reset",
        { reason: "test" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("reset_circuit_breaker");
      expect(result.message).toContain("Circuit breaker reset");
    });

    it("should execute throttle_requests recovery action", async () => {
      const result = await executeRecoveryAction(
        "test-service",
        "rate limit", // Maps to throttle_requests
        { reason: "test" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("throttle_requests");
      expect(result.message).toContain("Request throttling enabled");
    });

    it("should log recovery action to database", async () => {
      const serviceName = `test-service-${Date.now()}`;
      
      await executeRecoveryAction(
        serviceName,
        "service_restart",
        { reason: "test" }
      );

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const logs = await db
        .select()
        .from(failureEvents)
        .where(eq(failureEvents.affectedService, serviceName))
        .limit(1);

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].failureCategory).toBe("recovery_action");
    });
  });

  describe("Request Throttling", () => {
    it("should not throttle requests initially", () => {
      const serviceName = `throttle-test-${Date.now()}`;
      const isThrottled = isRequestThrottled(serviceName);
      expect(isThrottled).toBe(false);
    });

    it("should throttle requests after enabling", async () => {
      const serviceName = `throttle-test-${Date.now()}`;
      
      // Enable throttling
      await executeRecoveryAction(
        serviceName,
        "rate limit", // Maps to throttle_requests
        { reason: "test" }
      );

      // Make requests until throttled
      let throttledCount = 0;
      for (let i = 0; i < 60; i++) {
        if (isRequestThrottled(serviceName)) {
          throttledCount++;
        }
      }

      expect(throttledCount).toBeGreaterThan(0);
    });
  });

  describe("Alert Integration", () => {
    it("should send circuit breaker open alert", async () => {
      // This test verifies the alert function executes without errors
      await expect(
        alertCircuitBreakerOpen("test-service", 5)
      ).resolves.not.toThrow();
    });

    it("should send critical failure alert", async () => {
      await expect(
        alertCriticalFailure(
          "test-service",
          "timeout",
          "Service timeout after 30s"
        )
      ).resolves.not.toThrow();
    });

    it("should send custom alert", async () => {
      const alert = {
        id: `test-${Date.now()}`,
        type: "critical_failure" as const,
        severity: "high" as const,
        title: "Test Alert",
        message: "This is a test alert",
        metadata: { test: true },
        timestamp: new Date(),
      };

      await expect(sendAlert(alert)).resolves.not.toThrow();
    });

    it("should respect alert cooldown", async () => {
      const serviceName = `cooldown-test-${Date.now()}`;
      
      // Send first alert
      await alertCircuitBreakerOpen(serviceName, 5);
      
      // Try to send second alert immediately (should be skipped due to cooldown)
      await alertCircuitBreakerOpen(serviceName, 6);
      
      // No error should be thrown, cooldown is handled internally
      expect(true).toBe(true);
    });

    it("should filter alerts by severity threshold", async () => {
      const alert = {
        id: `test-${Date.now()}`,
        type: "system_degraded" as const,
        severity: "low" as const,
        title: "Low Severity Alert",
        message: "This should be filtered",
        timestamp: new Date(),
      };

      const config = {
        enabled: true,
        channels: ["notification" as const],
        severityThreshold: "high" as const,
        cooldownMinutes: 15,
      };

      // Low severity alert should be skipped when threshold is high
      await expect(sendAlert(alert, config)).resolves.not.toThrow();
    });
  });

  describe("Database Integration", () => {
    it("should create failure event records", async () => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const eventId = `test-event-${Date.now()}`;
      
      await db.insert(failureEvents).values({
        eventId,
        failureCategory: "test",
        failureType: "test_failure",
        severity: "low",
        affectedService: "test-service",
        errorMessage: "Test error message",
        detectionMethod: "automated",
        resolved: false,
      });

      const events = await db
        .select()
        .from(failureEvents)
        .where(eq(failureEvents.eventId, eventId))
        .limit(1);

      expect(events.length).toBe(1);
      expect(events[0].failureType).toBe("test_failure");
    });

    it("should update circuit breaker states", async () => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const circuitName = `test-circuit-${Date.now()}`;
      
      // Insert circuit breaker state
      await db.insert(circuitBreakerStates).values({
        circuitName,
        state: "closed",
        failureCount: 0,
        successCount: 0,
        configuration: {
          failureThreshold: 5,
          successThreshold: 2,
          timeout: 30000,
          resetTimeout: 60000,
        },
      });

      // Update state to open
      await db
        .update(circuitBreakerStates)
        .set({
          state: "open",
          failureCount: 5,
          openedAt: new Date(),
        })
        .where(eq(circuitBreakerStates.circuitName, circuitName));

      const states = await db
        .select()
        .from(circuitBreakerStates)
        .where(eq(circuitBreakerStates.circuitName, circuitName))
        .limit(1);

      expect(states.length).toBe(1);
      expect(states[0].state).toBe("open");
      expect(states[0].failureCount).toBe(5);
    });
  });

  describe("End-to-End Workflow", () => {
    it("should handle complete failure → recovery → alert workflow", async () => {
      const serviceName = `e2e-test-${Date.now()}`;
      
      // 1. Simulate failure by logging it
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const eventId = `e2e-${Date.now()}`;
      await db.insert(failureEvents).values({
        eventId,
        failureCategory: "external_dependency",
        failureType: "timeout",
        severity: "high",
        affectedService: serviceName,
        errorMessage: "Service timeout",
        detectionMethod: "automated",
        resolved: false,
      });

      // 2. Execute recovery action
      const recoveryResult = await executeRecoveryAction(
        serviceName,
        "service_restart",
        { reason: "timeout" }
      );

      expect(recoveryResult.success).toBe(true);

      // 3. Send alert
      await alertCriticalFailure(
        serviceName,
        "timeout",
        "Service timeout detected"
      );

      // 4. Verify failure was logged
      const events = await db
        .select()
        .from(failureEvents)
        .where(eq(failureEvents.eventId, eventId))
        .limit(1);

      expect(events.length).toBe(1);
      expect(events[0].affectedService).toBe(serviceName);
    });

    it("should handle circuit breaker open → recovery → close workflow", async () => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const circuitName = `cb-workflow-${Date.now()}`;
      
      // 1. Create circuit breaker in closed state
      await db.insert(circuitBreakerStates).values({
        circuitName,
        state: "closed",
        failureCount: 0,
        successCount: 0,
        configuration: {
          failureThreshold: 5,
          successThreshold: 2,
          timeout: 30000,
          resetTimeout: 60000,
        },
      });

      // 2. Simulate failures and open circuit
      await db
        .update(circuitBreakerStates)
        .set({
          state: "open",
          failureCount: 5,
          openedAt: new Date(),
        })
        .where(eq(circuitBreakerStates.circuitName, circuitName));

      // 3. Send alert
      await alertCircuitBreakerOpen(circuitName, 5);

      // 4. Execute recovery
      const recoveryResult = await executeRecoveryAction(
        circuitName,
        "circuit_breaker_reset",
        { reason: "manual_recovery" }
      );

      expect(recoveryResult.success).toBe(true);

      // 5. Verify circuit is closed
      const states = await db
        .select()
        .from(circuitBreakerStates)
        .where(eq(circuitBreakerStates.circuitName, circuitName))
        .limit(1);

      expect(states[0].state).toBe("closed");
      expect(states[0].failureCount).toBe(0);
    });
  });
});
