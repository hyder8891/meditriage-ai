/**
 * Self-Healing System - Alerting Integration
 * 
 * Sends alerts to administrators when critical failures occur:
 * - Circuit breaker opens
 * - Critical failures detected
 * - Recovery actions fail
 * - System health degraded
 */

import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { failureEvents, circuitBreakerStates } from "../drizzle/self-healing-schema";
import { eq, and, gte, desc } from "drizzle-orm";

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  severityThreshold: "low" | "medium" | "high" | "critical";
  cooldownMinutes: number; // Prevent alert spam
}

export type AlertChannel = "notification" | "email" | "sms" | "slack";

export interface Alert {
  id: string;
  type: AlertType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type AlertType =
  | "circuit_breaker_open"
  | "circuit_breaker_half_open"
  | "critical_failure"
  | "recovery_failure"
  | "system_degraded"
  | "high_failure_rate"
  | "service_unresponsive";

/**
 * Alert cooldown tracking to prevent spam
 */
const alertCooldowns = new Map<string, Date>();

/**
 * Default alert configuration
 */
const defaultConfig: AlertConfig = {
  enabled: true,
  channels: ["notification"], // Only notification channel is available by default
  severityThreshold: "high",
  cooldownMinutes: 15,
};

/**
 * Send alert through configured channels
 */
export async function sendAlert(alert: Alert, config: AlertConfig = defaultConfig): Promise<void> {
  if (!config.enabled) {
    console.log("[Alerts] Alerting disabled, skipping alert:", alert.title);
    return;
  }

  // Check severity threshold
  const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
  if (severityLevels[alert.severity] < severityLevels[config.severityThreshold]) {
    console.log("[Alerts] Alert below severity threshold, skipping:", alert.title);
    return;
  }

  // Check cooldown
  const cooldownKey = `${alert.type}:${alert.metadata?.serviceName || "global"}`;
  const lastAlert = alertCooldowns.get(cooldownKey);
  const now = new Date();
  
  if (lastAlert) {
    const cooldownMs = config.cooldownMinutes * 60 * 1000;
    const timeSinceLastAlert = now.getTime() - lastAlert.getTime();
    
    if (timeSinceLastAlert < cooldownMs) {
      console.log("[Alerts] Alert in cooldown period, skipping:", alert.title);
      return;
    }
  }

  // Update cooldown
  alertCooldowns.set(cooldownKey, now);

  // Send through configured channels
  for (const channel of config.channels) {
    try {
      await sendAlertToChannel(alert, channel);
    } catch (error) {
      console.error(`[Alerts] Failed to send alert via ${channel}:`, error);
    }
  }
}

/**
 * Send alert to specific channel
 */
async function sendAlertToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
  switch (channel) {
    case "notification":
      await sendNotificationAlert(alert);
      break;
    case "email":
      await sendEmailAlert(alert);
      break;
    case "sms":
      await sendSMSAlert(alert);
      break;
    case "slack":
      await sendSlackAlert(alert);
      break;
    default:
      console.warn(`[Alerts] Unknown alert channel: ${channel}`);
  }
}

/**
 * Send alert via Manus notification system
 */
async function sendNotificationAlert(alert: Alert): Promise<void> {
  const emoji = getSeverityEmoji(alert.severity);
  const success = await notifyOwner({
    title: `${emoji} ${alert.title}`,
    content: alert.message,
  });

  if (success) {
    console.log("[Alerts] Notification sent successfully:", alert.title);
  } else {
    console.error("[Alerts] Failed to send notification:", alert.title);
  }
}

/**
 * Send alert via email (placeholder - requires email service integration)
 */
async function sendEmailAlert(alert: Alert): Promise<void> {
  console.log("[Alerts] Email alerting not yet implemented:", alert.title);
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // Example implementation:
  // await emailService.send({
  //   to: config.emailRecipients,
  //   subject: alert.title,
  //   body: alert.message,
  //   priority: alert.severity === "critical" ? "high" : "normal"
  // });
}

/**
 * Send alert via SMS (placeholder - requires SMS service integration)
 */
async function sendSMSAlert(alert: Alert): Promise<void> {
  console.log("[Alerts] SMS alerting not yet implemented:", alert.title);
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  // Example implementation:
  // await smsService.send({
  //   to: config.phoneNumbers,
  //   message: `${alert.title}: ${alert.message}`
  // });
}

/**
 * Send alert via Slack (placeholder - requires Slack integration)
 */
async function sendSlackAlert(alert: Alert): Promise<void> {
  console.log("[Alerts] Slack alerting not yet implemented:", alert.title);
  // TODO: Integrate with Slack API
  // Example implementation:
  // await slackService.postMessage({
  //   channel: config.slackChannel,
  //   text: alert.title,
  //   attachments: [{
  //     color: getSeverityColor(alert.severity),
  //     text: alert.message,
  //     fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
  //       title: key,
  //       value: String(value),
  //       short: true
  //     }))
  //   }]
  // });
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case "critical":
      return "🚨";
    case "high":
      return "⚠️";
    case "medium":
      return "⚡";
    case "low":
      return "ℹ️";
    default:
      return "📢";
  }
}

/**
 * Get color for severity level (for Slack, email, etc.)
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#dc2626"; // red-600
    case "high":
      return "#ea580c"; // orange-600
    case "medium":
      return "#ca8a04"; // yellow-600
    case "low":
      return "#2563eb"; // blue-600
    default:
      return "#6b7280"; // gray-500
  }
}

/**
 * Alert when circuit breaker opens
 */
export async function alertCircuitBreakerOpen(
  serviceName: string,
  failureCount: number,
  config?: AlertConfig
): Promise<void> {
  const alert: Alert = {
    id: `cb-open-${Date.now()}`,
    type: "circuit_breaker_open",
    severity: "high",
    title: `Circuit Breaker Opened: ${serviceName}`,
    message: `Circuit breaker for ${serviceName} has opened after ${failureCount} consecutive failures. Service requests will be blocked until recovery.`,
    metadata: { serviceName, failureCount },
    timestamp: new Date(),
  };

  await sendAlert(alert, config);
}

/**
 * Alert when circuit breaker enters half-open state
 */
export async function alertCircuitBreakerHalfOpen(
  serviceName: string,
  config?: AlertConfig
): Promise<void> {
  const alert: Alert = {
    id: `cb-halfopen-${Date.now()}`,
    type: "circuit_breaker_half_open",
    severity: "medium",
    title: `Circuit Breaker Half-Open: ${serviceName}`,
    message: `Circuit breaker for ${serviceName} is attempting recovery. Testing service availability...`,
    metadata: { serviceName },
    timestamp: new Date(),
  };

  await sendAlert(alert, config);
}

/**
 * Alert on critical failure
 */
export async function alertCriticalFailure(
  serviceName: string,
  failureType: string,
  errorMessage: string,
  config?: AlertConfig
): Promise<void> {
  const alert: Alert = {
    id: `critical-${Date.now()}`,
    type: "critical_failure",
    severity: "critical",
    title: `Critical Failure: ${serviceName}`,
    message: `Critical failure detected in ${serviceName}: ${failureType}. Error: ${errorMessage}`,
    metadata: { serviceName, failureType, errorMessage },
    timestamp: new Date(),
  };

  await sendAlert(alert, config);
}

/**
 * Alert when recovery action fails
 */
export async function alertRecoveryFailure(
  serviceName: string,
  actionType: string,
  errorMessage: string,
  config?: AlertConfig
): Promise<void> {
  const alert: Alert = {
    id: `recovery-fail-${Date.now()}`,
    type: "recovery_failure",
    severity: "high",
    title: `Recovery Action Failed: ${serviceName}`,
    message: `Automated recovery action (${actionType}) failed for ${serviceName}. Manual intervention may be required. Error: ${errorMessage}`,
    metadata: { serviceName, actionType, errorMessage },
    timestamp: new Date(),
  };

  await sendAlert(alert, config);
}

/**
 * Alert when system health is degraded
 */
export async function alertSystemDegraded(
  reason: string,
  affectedServices: string[],
  config?: AlertConfig
): Promise<void> {
  const alert: Alert = {
    id: `degraded-${Date.now()}`,
    type: "system_degraded",
    severity: "high",
    title: "System Health Degraded",
    message: `System health has degraded: ${reason}. Affected services: ${affectedServices.join(", ")}`,
    metadata: { reason, affectedServices },
    timestamp: new Date(),
  };

  await sendAlert(alert, config);
}

/**
 * Alert on high failure rate
 */
export async function alertHighFailureRate(
  serviceName: string,
  failureRate: number,
  threshold: number,
  config?: AlertConfig
): Promise<void> {
  const alert: Alert = {
    id: `high-rate-${Date.now()}`,
    type: "high_failure_rate",
    severity: "medium",
    title: `High Failure Rate: ${serviceName}`,
    message: `${serviceName} is experiencing a high failure rate of ${failureRate.toFixed(1)}% (threshold: ${threshold}%). Monitoring for potential issues.`,
    metadata: { serviceName, failureRate, threshold },
    timestamp: new Date(),
  };

  await sendAlert(alert, config);
}

/**
 * Alert when service becomes unresponsive
 */
export async function alertServiceUnresponsive(
  serviceName: string,
  duration: number,
  config?: AlertConfig
): Promise<void> {
  const alert: Alert = {
    id: `unresponsive-${Date.now()}`,
    type: "service_unresponsive",
    severity: "critical",
    title: `Service Unresponsive: ${serviceName}`,
    message: `${serviceName} has been unresponsive for ${duration} seconds. Immediate attention required.`,
    metadata: { serviceName, duration },
    timestamp: new Date(),
  };

  await sendAlert(alert, config);
}

/**
 * Monitor for alert conditions and send alerts
 */
export async function monitorAndAlert(config: AlertConfig = defaultConfig): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      return;
    }

    // Check for open circuit breakers
    const openCircuits = await db
      .select()
      .from(circuitBreakerStates)
      .where(eq(circuitBreakerStates.state, "open"));

    for (const circuit of openCircuits) {
      // Only alert if recently opened (within last 5 minutes)
      const openedAt = circuit.openedAt;
      if (openedAt) {
        const minutesSinceOpen = (Date.now() - openedAt.getTime()) / 1000 / 60;
        if (minutesSinceOpen < 5) {
          await alertCircuitBreakerOpen(circuit.circuitName, circuit.failureCount, config);
        }
      }
    }

    // Check for recent critical failures
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const criticalFailures = await db
      .select()
      .from(failureEvents)
      .where(
        and(
          eq(failureEvents.severity, "critical"),
          gte(failureEvents.timestamp, fiveMinutesAgo),
          eq(failureEvents.resolved, false)
        )
      )
      .orderBy(desc(failureEvents.timestamp))
      .limit(5);

    for (const failure of criticalFailures) {
      await alertCriticalFailure(
        failure.affectedService,
        failure.failureType,
        failure.errorMessage || "Unknown error",
        config
      );
    }
  } catch (error) {
    console.error("[Alerts] Error in monitoring and alerting:", error);
  }
}

/**
 * Start alert monitoring scheduler
 */
export function startAlertMonitoring(config: AlertConfig = defaultConfig): void {
  // Check for alert conditions every 2 minutes
  setInterval(async () => {
    await monitorAndAlert(config);
  }, 2 * 60 * 1000);

  console.log("[Alerts] Alert monitoring started");
}
