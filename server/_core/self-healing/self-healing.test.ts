/**
 * Self-Healing System Tests
 * Comprehensive test suite for all self-healing components
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { RetryManager } from "./retry-manager";
import { CircuitBreaker, CircuitBreakerError } from "./circuit-breaker";
import { GlobalErrorHandler } from "./global-error-handler";

describe("RetryManager", () => {
  it("should succeed on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const result = await RetryManager.executeWithRetry(fn, {
      maxAttempts: 3,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe("success");
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValue("success");

    const result = await RetryManager.executeWithRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      jitter: false,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe("success");
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should fail after max attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Persistent failure"));

    const result = await RetryManager.executeWithRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      jitter: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe("Persistent failure");
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should respect retryable errors list", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Not retryable"));

    const result = await RetryManager.executeWithRetry(fn, {
      maxAttempts: 3,
      retryableErrors: ["timeout", "connection"],
      baseDelayMs: 10,
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1); // Should not retry
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should identify retryable errors correctly", () => {
    expect(RetryManager.isRetryableError(new Error("Connection timeout"))).toBe(
      true
    );
    expect(RetryManager.isRetryableError(new Error("ECONNREFUSED"))).toBe(true);
    expect(RetryManager.isRetryableError(new Error("Rate limit exceeded"))).toBe(
      true
    );
    expect(
      RetryManager.isRetryableError(new Error("Service unavailable"))
    ).toBe(true);
    expect(RetryManager.isRetryableError(new Error("Invalid input"))).toBe(
      false
    );
  });

  it("should call onRetry callback", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failure"))
      .mockResolvedValue("success");

    const onRetry = vi.fn();

    await RetryManager.executeWithRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });
});

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;
  let testCounter = 0;

  beforeEach(() => {
    testCounter++;
    breaker = new CircuitBreaker(`test-circuit-${testCounter}-${Date.now()}`, {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 100,
    });
  });

  it("should execute successfully when circuit is closed", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const result = await breaker.execute(fn);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(breaker.getState().state).toBe("closed");
  });

  it("should open circuit after failure threshold", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Service failure"));

    // Trigger failures to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(fn);
      } catch (error) {
        // Expected
      }
    }

    const state = breaker.getState();
    expect(state.state).toBe("open");
    expect(state.failureCount).toBe(3);
  });

  it("should reject requests when circuit is open", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Service failure"));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(fn);
      } catch (error) {
        // Expected
      }
    }

    // Try to execute when circuit is open
    await expect(breaker.execute(fn)).rejects.toThrow(CircuitBreakerError);
  });

  it("should transition to half-open after reset timeout", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    // Open the circuit by triggering failures
    const failFn = vi.fn().mockRejectedValue(new Error("Failure"));
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failFn);
      } catch (error) {
        // Expected
      }
    }

    // Verify circuit is open
    const stateAfterFailures = breaker.getState();
    expect(stateAfterFailures.state).toBe("open");

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Next execution should transition to half-open
    const result = await breaker.execute(fn);
    expect(result).toBe("success");
  });

  it("should close circuit after success threshold in half-open", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new Error("Failure"))
      .mockResolvedValue("success");

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(fn);
      } catch (error) {
        // Expected
      }
    }

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Execute successfully twice (success threshold)
    await breaker.execute(fn);
    await breaker.execute(fn);

    expect(breaker.getState().state).toBe("closed");
    expect(breaker.getState().failureCount).toBe(0);
  });

  it("should timeout long-running operations", async () => {
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve("success"), 2000))
    );

    await expect(breaker.execute(fn)).rejects.toThrow("timeout");
  });

  it("should reset circuit manually", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Failure"));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(fn);
      } catch (error) {
        // Expected
      }
    }

    expect(breaker.getState().state).toBe("open");

    // Manual reset
    await breaker.reset();

    expect(breaker.getState().state).toBe("closed");
    expect(breaker.getState().failureCount).toBe(0);
  });
});

describe("GlobalErrorHandler", () => {
  let handler: GlobalErrorHandler;

  beforeEach(() => {
    handler = GlobalErrorHandler.getInstance();
  });

  it("should categorize error severity correctly", () => {
    expect(
      handler.categorizeSeverity(new Error("Database connection failed"))
    ).toBe("critical");
    expect(handler.categorizeSeverity(new Error("Timeout occurred"))).toBe(
      "high"
    );
    expect(handler.categorizeSeverity(new Error("Resource not found"))).toBe(
      "medium"
    );
    expect(handler.categorizeSeverity(new Error("Minor issue"))).toBe("low");
  });

  it("should categorize error types correctly", () => {
    expect(handler.categorizeError(new Error("Connection timeout"))).toBe(
      "timeout"
    );
    expect(handler.categorizeError(new Error("Database error"))).toBe(
      "database"
    );
    expect(handler.categorizeError(new Error("Rate limit exceeded"))).toBe(
      "rate_limit"
    );
    expect(handler.categorizeError(new Error("Redis error occurred"))).toBe(
      "cache"
    );
    expect(handler.categorizeError(new TypeError("Invalid type"))).toBe(
      "type_error"
    );
  });

  it("should call registered handlers on error", async () => {
    const mockHandler = vi.fn();
    handler.registerHandler(mockHandler);

    const error = new Error("Test error");
    await handler.handleError({
      errorId: "test-123",
      timestamp: new Date(),
      error,
      errorType: "test",
      severity: "medium",
      source: "test-source",
    });

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        errorId: "test-123",
        errorType: "test",
        severity: "medium",
      })
    );
  });

  it("should handle handler failures gracefully", async () => {
    const failingHandler = vi.fn().mockRejectedValue(new Error("Handler failed"));
    const workingHandler = vi.fn();

    handler.registerHandler(failingHandler);
    handler.registerHandler(workingHandler);

    const error = new Error("Test error");
    await handler.handleError({
      errorId: "test-123",
      timestamp: new Date(),
      error,
      errorType: "test",
      severity: "medium",
      source: "test-source",
    });

    // Both handlers should be called despite first one failing
    expect(failingHandler).toHaveBeenCalledTimes(1);
    expect(workingHandler).toHaveBeenCalledTimes(1);
  });
});
