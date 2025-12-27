/**
 * Health Monitoring System
 * Continuously monitors system health and detects anomalies
 */

import { getDb } from "../../db";

export interface HealthCheckResult {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheckResult[];
  timestamp: number;
}

export type HealthCheck = () => Promise<HealthCheckResult>;

/**
 * Health Check Registry
 * Manages all health checks in the system
 */
export class HealthCheckRegistry {
  private static instance: HealthCheckRegistry;
  private checks: Map<string, HealthCheck> = new Map();

  private constructor() {}

  static getInstance(): HealthCheckRegistry {
    if (!HealthCheckRegistry.instance) {
      HealthCheckRegistry.instance = new HealthCheckRegistry();
    }
    return HealthCheckRegistry.instance;
  }

  /**
   * Register a health check
   */
  register(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
    console.log(`[HealthCheckRegistry] Registered health check: ${name}`);
  }

  /**
   * Execute all health checks
   */
  async executeAll(): Promise<SystemHealth> {
    const results: HealthCheckResult[] = [];
    const checkPromises: Promise<void>[] = [];

    this.checks.forEach((check, name) => {
      const promise = (async () => {
        try {
          const result = await Promise.race([
            check(),
            this.timeout(name, 5000), // 5 second timeout
          ]);
          results.push(result);
        } catch (error) {
          results.push({
            name,
            status: "unhealthy",
            latency: 5000,
            message: `Health check failed: ${(error as Error).message}`,
          });
        }
      })();
      checkPromises.push(promise);
    });

    await Promise.all(checkPromises);

    const overall = this.determineOverallHealth(results);

    return {
      overall,
      checks: results,
      timestamp: Date.now(),
    };
  }

  /**
   * Execute a specific health check
   */
  async execute(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    try {
      return await Promise.race([check(), this.timeout(name, 5000)]);
    } catch (error) {
      return {
        name,
        status: "unhealthy",
        latency: 5000,
        message: `Health check failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Timeout helper for health checks
   */
  private timeout(name: string, ms: number): Promise<HealthCheckResult> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Health check '${name}' timed out after ${ms}ms`)),
        ms
      )
    );
  }

  /**
   * Determine overall system health from individual checks
   */
  private determineOverallHealth(
    checks: HealthCheckResult[]
  ): "healthy" | "degraded" | "unhealthy" {
    const unhealthyCount = checks.filter((c) => c.status === "unhealthy").length;
    const degradedCount = checks.filter((c) => c.status === "degraded").length;

    if (unhealthyCount > 0) return "unhealthy";
    if (degradedCount > 0) return "degraded";
    return "healthy";
  }

  /**
   * Get all registered health check names
   */
  getCheckNames(): string[] {
    return Array.from(this.checks.keys());
  }
}

/**
 * Built-in Health Checks
 */
export function registerBuiltInHealthChecks(): void {
  const registry = HealthCheckRegistry.getInstance();

  // Database health check
  registry.register("database", async () => {
    const start = Date.now();
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database connection not available");
      }
      await db.execute("SELECT 1");
      const latency = Date.now() - start;

      return {
        name: "database",
        status: latency < 100 ? "healthy" : "degraded",
        latency,
        message: latency < 100 ? "Database responsive" : "Database slow",
      };
    } catch (error) {
      return {
        name: "database",
        status: "unhealthy",
        latency: Date.now() - start,
        message: `Database connection failed: ${(error as Error).message}`,
      };
    }
  });

  // Memory health check
  registry.register("memory", async () => {
    const start = Date.now();
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    let message = "Memory usage normal";

    if (heapUsedPercent > 90) {
      status = "unhealthy";
      message = "Critical memory usage";
    } else if (heapUsedPercent > 75) {
      status = "degraded";
      message = "High memory usage";
    }

    return {
      name: "memory",
      status,
      latency: Date.now() - start,
      message,
      metadata: {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        heapUsedPercent: heapUsedPercent.toFixed(2),
        rss: usage.rss,
      },
    };
  });

  // CPU health check
  registry.register("cpu", async () => {
    const start = Date.now();
    const usage = process.cpuUsage();
    const uptimeMs = process.uptime() * 1000;

    // Calculate CPU percentage (rough estimate)
    const cpuPercent = ((usage.user + usage.system) / (uptimeMs * 1000)) * 100;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    let message = "CPU usage normal";

    if (cpuPercent > 95) {
      status = "unhealthy";
      message = "Critical CPU usage";
    } else if (cpuPercent > 80) {
      status = "degraded";
      message = "High CPU usage";
    }

    return {
      name: "cpu",
      status,
      latency: Date.now() - start,
      message,
      metadata: {
        cpuPercent: cpuPercent.toFixed(2),
        user: usage.user,
        system: usage.system,
      },
    };
  });

  // Event loop lag check
  registry.register("event_loop", async () => {
    const start = Date.now();

    // Measure event loop lag
    await new Promise((resolve) => setImmediate(resolve));
    const lag = Date.now() - start;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    let message = "Event loop responsive";

    if (lag > 100) {
      status = "unhealthy";
      message = "Event loop severely lagged";
    } else if (lag > 50) {
      status = "degraded";
      message = "Event loop lagged";
    }

    return {
      name: "event_loop",
      status,
      latency: lag,
      message,
      metadata: {
        lagMs: lag,
      },
    };
  });
}

/**
 * Health Monitor Service
 * Periodically executes health checks and records results
 */
export class HealthMonitorService {
  private static instance: HealthMonitorService;
  private registry: HealthCheckRegistry;
  private checkInterval = 30000; // 30 seconds
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastHealthStatus: SystemHealth | null = null;

  private constructor() {
    this.registry = HealthCheckRegistry.getInstance();
  }

  static getInstance(): HealthMonitorService {
    if (!HealthMonitorService.instance) {
      HealthMonitorService.instance = new HealthMonitorService();
    }
    return HealthMonitorService.instance;
  }

  /**
   * Start periodic health monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.warn("[HealthMonitor] Already running");
      return;
    }

    console.log("[HealthMonitor] Starting health monitoring service");
    this.isRunning = true;

    // Execute immediately
    this.executeHealthChecks();

    // Then execute periodically
    this.intervalTimer = setInterval(() => {
      this.executeHealthChecks();
    }, this.checkInterval);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    console.log("[HealthMonitor] Stopped health monitoring service");
  }

  /**
   * Get last health status
   */
  getLastHealthStatus(): SystemHealth | null {
    return this.lastHealthStatus;
  }

  /**
   * Execute all health checks and record results
   */
  private async executeHealthChecks(): Promise<void> {
    try {
      const health = await this.registry.executeAll();
      this.lastHealthStatus = health;

      // Log unhealthy checks
      const unhealthyChecks = health.checks.filter((c) => c.status === "unhealthy");
      if (unhealthyChecks.length > 0) {
        console.warn(
          "[HealthMonitor] Unhealthy checks detected:",
          unhealthyChecks.map((c) => `${c.name}: ${c.message}`).join(", ")
        );
      }

      // Log overall status
      if (health.overall !== "healthy") {
        console.warn(`[HealthMonitor] System health: ${health.overall}`);
      }
    } catch (error) {
      console.error("[HealthMonitor] Failed to execute health checks:", error);
    }
  }
}
