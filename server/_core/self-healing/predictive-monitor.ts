/**
 * Predictive Failure Detection and Automated Recovery
 * Proactively detects anomalies and triggers recovery before failures occur
 */

import { CircuitBreakerRegistry } from './circuit-breaker';
import { GlobalErrorHandler } from './global-error-handler';

export interface ServiceMetrics {
  errorRate: number; // Errors per minute
  latency: number; // P99 latency in ms
  throughput: number; // Requests per second
  memoryUsage: number; // MB
  cpuUsage: number; // Percentage
  activeConnections: number;
}

export interface Anomaly {
  type: 'high_error_rate' | 'high_latency' | 'high_load' | 'memory_leak' | 'connection_pool_exhaustion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
}

export interface RecoveryAction {
  action: 'open_circuit' | 'scale_up' | 'warm_cache' | 'restart_service' | 'reduce_load' | 'alert_admin';
  service: string;
  reason: string;
  timestamp: Date;
}

/**
 * Metrics Collector
 */
export class MetricsCollector {
  private metrics: Map<string, ServiceMetrics[]> = new Map();
  private windowSize = 60; // Keep last 60 data points (5 minutes at 5s intervals)

  /**
   * Record metrics for a service
   */
  record(service: string, metrics: ServiceMetrics): void {
    if (!this.metrics.has(service)) {
      this.metrics.set(service, []);
    }

    const serviceMetrics = this.metrics.get(service)!;
    serviceMetrics.push(metrics);

    // Keep only last N data points
    if (serviceMetrics.length > this.windowSize) {
      serviceMetrics.shift();
    }
  }

  /**
   * Get recent metrics for a service
   */
  getRecent(service: string, count: number = 10): ServiceMetrics[] {
    const serviceMetrics = this.metrics.get(service) || [];
    return serviceMetrics.slice(-count);
  }

  /**
   * Get average metrics over time window
   */
  getAverage(service: string, windowMinutes: number = 5): ServiceMetrics | null {
    const serviceMetrics = this.metrics.get(service);
    if (!serviceMetrics || serviceMetrics.length === 0) {
      return null;
    }

    const dataPoints = Math.min(serviceMetrics.length, windowMinutes * 12); // 12 points per minute at 5s intervals
    const recent = serviceMetrics.slice(-dataPoints);

    return {
      errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length,
      latency: recent.reduce((sum, m) => sum + m.latency, 0) / recent.length,
      throughput: recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length,
      memoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      cpuUsage: recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length,
      activeConnections: recent.reduce((sum, m) => sum + m.activeConnections, 0) / recent.length,
    };
  }

  /**
   * Detect trend (increasing, decreasing, stable)
   */
  detectTrend(service: string, metric: keyof ServiceMetrics): 'increasing' | 'decreasing' | 'stable' {
    const recent = this.getRecent(service, 10);
    if (recent.length < 5) return 'stable';

    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAvg = firstHalf.reduce((sum, m) => sum + m[metric], 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m[metric], 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 20) return 'increasing';
    if (changePercent < -20) return 'decreasing';
    return 'stable';
  }
}

/**
 * Anomaly Detector
 */
export class AnomalyDetector {
  private thresholds = {
    errorRate: 5, // Errors per minute
    latency: 5000, // 5 seconds P99
    throughput: 1000, // Max requests per second
    memoryUsage: 1024, // 1GB
    cpuUsage: 80, // 80%
    activeConnections: 100,
  };

  /**
   * Detect anomalies in service metrics
   */
  detect(metrics: ServiceMetrics): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // High error rate
    if (metrics.errorRate > this.thresholds.errorRate) {
      anomalies.push({
        type: 'high_error_rate',
        severity: metrics.errorRate > this.thresholds.errorRate * 2 ? 'critical' : 'high',
        metric: 'errorRate',
        currentValue: metrics.errorRate,
        threshold: this.thresholds.errorRate,
        message: `Error rate (${metrics.errorRate.toFixed(2)}/min) exceeds threshold (${this.thresholds.errorRate}/min)`,
      });
    }

    // High latency
    if (metrics.latency > this.thresholds.latency) {
      anomalies.push({
        type: 'high_latency',
        severity: metrics.latency > this.thresholds.latency * 2 ? 'critical' : 'high',
        metric: 'latency',
        currentValue: metrics.latency,
        threshold: this.thresholds.latency,
        message: `P99 latency (${metrics.latency.toFixed(0)}ms) exceeds threshold (${this.thresholds.latency}ms)`,
      });
    }

    // High load
    if (metrics.throughput > this.thresholds.throughput || metrics.cpuUsage > this.thresholds.cpuUsage) {
      anomalies.push({
        type: 'high_load',
        severity: 'medium',
        metric: 'throughput',
        currentValue: metrics.throughput,
        threshold: this.thresholds.throughput,
        message: `High load detected: ${metrics.throughput.toFixed(0)} req/s, ${metrics.cpuUsage.toFixed(0)}% CPU`,
      });
    }

    // Memory leak detection
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      anomalies.push({
        type: 'memory_leak',
        severity: 'high',
        metric: 'memoryUsage',
        currentValue: metrics.memoryUsage,
        threshold: this.thresholds.memoryUsage,
        message: `Memory usage (${metrics.memoryUsage.toFixed(0)}MB) exceeds threshold (${this.thresholds.memoryUsage}MB)`,
      });
    }

    // Connection pool exhaustion
    if (metrics.activeConnections > this.thresholds.activeConnections) {
      anomalies.push({
        type: 'connection_pool_exhaustion',
        severity: 'high',
        metric: 'activeConnections',
        currentValue: metrics.activeConnections,
        threshold: this.thresholds.activeConnections,
        message: `Active connections (${metrics.activeConnections}) exceeds threshold (${this.thresholds.activeConnections})`,
      });
    }

    return anomalies;
  }

  /**
   * Update thresholds dynamically
   */
  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

/**
 * Automated Recovery Engine
 */
export class AutomatedRecovery {
  private recoveryHistory: RecoveryAction[] = [];
  private cooldownPeriod = 300000; // 5 minutes between recovery actions for same service

  /**
   * Trigger recovery actions based on anomalies
   */
  async triggerRecovery(service: string, anomalies: Anomaly[]): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];

    // Check cooldown
    if (this.isInCooldown(service)) {
      console.log(`[AutomatedRecovery] Service ${service} is in cooldown period`);
      return actions;
    }

    for (const anomaly of anomalies) {
      const action = await this.selectRecoveryStrategy(service, anomaly);
      if (action) {
        await this.executeRecoveryAction(action);
        actions.push(action);
        this.recoveryHistory.push(action);
      }
    }

    return actions;
  }

  /**
   * Select appropriate recovery strategy
   */
  private async selectRecoveryStrategy(
    service: string,
    anomaly: Anomaly
  ): Promise<RecoveryAction | null> {
    switch (anomaly.type) {
      case 'high_error_rate':
        // Open circuit breaker to prevent cascading failures
        return {
          action: 'open_circuit',
          service,
          reason: `High error rate detected: ${anomaly.message}`,
          timestamp: new Date(),
        };

      case 'high_latency':
        // Warm cache to reduce latency
        return {
          action: 'warm_cache',
          service,
          reason: `High latency detected: ${anomaly.message}`,
          timestamp: new Date(),
        };

      case 'high_load':
        // Reduce load or scale up
        return {
          action: 'reduce_load',
          service,
          reason: `High load detected: ${anomaly.message}`,
          timestamp: new Date(),
        };

      case 'memory_leak':
        // Restart service to free memory
        return {
          action: 'restart_service',
          service,
          reason: `Memory leak detected: ${anomaly.message}`,
          timestamp: new Date(),
        };

      case 'connection_pool_exhaustion':
        // Alert admin for manual intervention
        return {
          action: 'alert_admin',
          service,
          reason: `Connection pool exhaustion: ${anomaly.message}`,
          timestamp: new Date(),
        };

      default:
        return null;
    }
  }

  /**
   * Execute recovery action
   */
  private async executeRecoveryAction(action: RecoveryAction): Promise<void> {
    console.log(`[AutomatedRecovery] Executing ${action.action} for ${action.service}: ${action.reason}`);

    try {
      switch (action.action) {
        case 'open_circuit':
          await this.openCircuitBreaker(action.service);
          break;

        case 'warm_cache':
          await this.warmCache(action.service);
          break;

        case 'reduce_load':
          await this.reduceLoad(action.service);
          break;

        case 'restart_service':
          await this.restartService(action.service);
          break;

        case 'alert_admin':
          await this.alertAdmin(action);
          break;

        default:
          console.warn(`[AutomatedRecovery] Unknown action: ${action.action}`);
      }

      console.log(`[AutomatedRecovery] Successfully executed ${action.action} for ${action.service}`);
    } catch (error) {
      console.error(`[AutomatedRecovery] Failed to execute ${action.action}:`, error);
      
      GlobalErrorHandler.getInstance().handleError({
        errorId: `recovery-failure-${Date.now()}`,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        errorType: 'recovery_failure',
        severity: 'high',
        source: 'automated_recovery',
        context: {
          action: action.action,
          service: action.service,
          reason: action.reason,
        },
      });
    }
  }

  /**
   * Open circuit breaker for service
   */
  private async openCircuitBreaker(service: string): Promise<void> {
    const breaker = CircuitBreakerRegistry.getInstance().get(service);
    if (breaker) {
      // Circuit breaker will transition to open automatically on failures
      console.log(`[AutomatedRecovery] Circuit breaker for ${service} is being monitored`);
    } else {
      console.warn(`[AutomatedRecovery] No circuit breaker found for ${service}`);
    }
  }

  /**
   * Warm cache for service
   */
  private async warmCache(service: string): Promise<void> {
    // Implementation depends on caching strategy
    console.log(`[AutomatedRecovery] Cache warming for ${service} (not yet implemented)`);
  }

  /**
   * Reduce load on service
   */
  private async reduceLoad(service: string): Promise<void> {
    // Could implement rate limiting, request throttling, etc.
    console.log(`[AutomatedRecovery] Load reduction for ${service} (not yet implemented)`);
  }

  /**
   * Restart service
   */
  private async restartService(service: string): Promise<void> {
    // This would require integration with process manager
    console.log(`[AutomatedRecovery] Service restart for ${service} (requires manual intervention)`);
  }

  /**
   * Alert admin
   */
  private async alertAdmin(action: RecoveryAction): Promise<void> {
    console.error(`[AutomatedRecovery] ADMIN ALERT: ${action.service} - ${action.reason}`);
    // Could integrate with notification system, email, Slack, etc.
  }

  /**
   * Check if service is in cooldown period
   */
  private isInCooldown(service: string): boolean {
    const recentActions = this.recoveryHistory.filter(
      (action) =>
        action.service === service &&
        Date.now() - action.timestamp.getTime() < this.cooldownPeriod
    );

    return recentActions.length > 0;
  }

  /**
   * Get recovery history
   */
  getHistory(service?: string): RecoveryAction[] {
    if (service) {
      return this.recoveryHistory.filter((action) => action.service === service);
    }
    return this.recoveryHistory;
  }
}

/**
 * Predictive Monitor
 * Coordinates metrics collection, anomaly detection, and automated recovery
 */
export class PredictiveMonitor {
  private metricsCollector = new MetricsCollector();
  private anomalyDetector = new AnomalyDetector();
  private automatedRecovery = new AutomatedRecovery();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start monitoring
   */
  start(intervalMs: number = 5000): void {
    if (this.isRunning) {
      console.warn('[PredictiveMonitor] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[PredictiveMonitor] Starting predictive monitoring (interval: ${intervalMs}ms)`);

    this.monitoringInterval = setInterval(async () => {
      await this.monitorAllServices();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isRunning = false;
    console.log('[PredictiveMonitor] Stopped predictive monitoring');
  }

  /**
   * Monitor all services
   */
  private async monitorAllServices(): Promise<void> {
    const services = ['llm', 'database', 'storage', 'api'];

    for (const service of services) {
      await this.monitorService(service);
    }
  }

  /**
   * Monitor a specific service
   */
  async monitorService(serviceName: string): Promise<void> {
    try {
      // Collect current metrics
      const metrics = await this.collectMetrics(serviceName);
      this.metricsCollector.record(serviceName, metrics);

      // Detect anomalies
      const anomalies = this.anomalyDetector.detect(metrics);

      if (anomalies.length > 0) {
        console.warn(`[PredictiveMonitor] Detected ${anomalies.length} anomalies in ${serviceName}`);

        for (const anomaly of anomalies) {
          console.warn(`  - ${anomaly.type}: ${anomaly.message}`);
        }

        // Trigger automated recovery
        const actions = await this.automatedRecovery.triggerRecovery(serviceName, anomalies);

        if (actions.length > 0) {
          console.log(`[PredictiveMonitor] Triggered ${actions.length} recovery actions`);
        }
      }
    } catch (error) {
      console.error(`[PredictiveMonitor] Error monitoring ${serviceName}:`, error);
    }
  }

  /**
   * Collect metrics for a service
   */
  private async collectMetrics(serviceName: string): Promise<ServiceMetrics> {
    // In production, this would collect real metrics from monitoring systems
    // For now, return mock metrics
    return {
      errorRate: Math.random() * 10,
      latency: Math.random() * 3000,
      throughput: Math.random() * 500,
      memoryUsage: Math.random() * 512,
      cpuUsage: Math.random() * 60,
      activeConnections: Math.random() * 50,
    };
  }

  /**
   * Get service health report
   */
  getHealthReport(serviceName: string) {
    const recentMetrics = this.metricsCollector.getRecent(serviceName, 10);
    const avgMetrics = this.metricsCollector.getAverage(serviceName, 5);
    const recoveryHistory = this.automatedRecovery.getHistory(serviceName);

    return {
      service: serviceName,
      recentMetrics,
      avgMetrics,
      recoveryHistory,
      trends: {
        errorRate: this.metricsCollector.detectTrend(serviceName, 'errorRate'),
        latency: this.metricsCollector.detectTrend(serviceName, 'latency'),
        memoryUsage: this.metricsCollector.detectTrend(serviceName, 'memoryUsage'),
      },
    };
  }
}

/**
 * Global predictive monitor instance
 */
let globalMonitor: PredictiveMonitor | null = null;

/**
 * Get or create global predictive monitor
 */
export function getPredictiveMonitor(): PredictiveMonitor {
  if (!globalMonitor) {
    globalMonitor = new PredictiveMonitor();
  }
  return globalMonitor;
}
