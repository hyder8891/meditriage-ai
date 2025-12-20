/**
 * AEC Notification Service
 * Handles email notifications for critical errors, manual reviews, and daily reports
 */

import { notifyOwner } from "../../_core/notification";
import { getDb } from "../../db";
import { aecDetectedErrors, aecDiagnostics, aecPatches } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type AlertType =
  | "critical_error"
  | "manual_review_required"
  | "patch_generated"
  | "deployment_success"
  | "deployment_failed"
  | "rollback_triggered"
  | "health_check_failed"
  | "daily_report";

export type AlertPriority = "low" | "medium" | "high" | "critical";

export interface Alert {
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Core Notification Function
// ============================================================================

/**
 * Send email notification to system owner
 */
export async function sendEmailNotification(alert: Alert): Promise<NotificationResult> {
  try {
    const emailContent = formatEmailContent(alert);
    
    const success = await notifyOwner({
      title: `[AEC ${alert.priority.toUpperCase()}] ${alert.title}`,
      content: emailContent,
    });

    if (success) {
      console.log(`[AEC Alerts] Email sent successfully: ${alert.title}`);
      return { success: true };
    } else {
      console.error(`[AEC Alerts] Failed to send email: ${alert.title}`);
      return { success: false, error: "Notification service unavailable" };
    }
  } catch (error: any) {
    console.error(`[AEC Alerts] Email error:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Format alert content for email
 */
function formatEmailContent(alert: Alert): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`🚨 AEC Alert - ${alert.type.replace(/_/g, " ").toUpperCase()}`);
  lines.push(`Priority: ${getPriorityEmoji(alert.priority)} ${alert.priority.toUpperCase()}`);
  lines.push(`Time: ${alert.timestamp.toLocaleString()}`);
  lines.push("");
  
  // Message
  lines.push(alert.message);
  lines.push("");
  
  // Details
  if (alert.details && Object.keys(alert.details).length > 0) {
    lines.push("📋 Details:");
    Object.entries(alert.details).forEach(([key, value]) => {
      lines.push(`  • ${key}: ${formatValue(value)}`);
    });
    lines.push("");
  }
  
  // Footer
  lines.push("---");
  lines.push("This is an automated notification from the AEC Self-Healing System.");
  lines.push("For more information, check the AEC dashboard or server logs.");
  
  return lines.join("\n");
}

/**
 * Get emoji for priority level
 */
function getPriorityEmoji(priority: AlertPriority): string {
  switch (priority) {
    case "critical": return "🔴";
    case "high": return "🟠";
    case "medium": return "🟡";
    case "low": return "🟢";
    default: return "⚪";
  }
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

// ============================================================================
// Specific Alert Functions
// ============================================================================

/**
 * Send critical error alert
 */
export async function sendCriticalErrorAlert(errorId: number): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    const [error] = await db
      .select()
      .from(aecDetectedErrors)
      .where(eq(aecDetectedErrors.id, errorId))
      .limit(1);

    if (!error) {
      return { success: false, error: "Error not found" };
    }

    const alert: Alert = {
      type: "critical_error",
      priority: error.severity === "critical" ? "critical" : "high",
      title: `Critical Error Detected: ${error.errorType}`,
      message: `A critical error has been detected in the My Doctor application and requires immediate attention.`,
      details: {
        "Error ID": errorId,
        "Error Type": error.errorType,
        "Severity": error.severity,
        "Source": error.source || "Unknown",
        "Message": error.message,
        "First Occurred": error.firstOccurrence?.toLocaleString(),
        "Occurrences": error.occurrenceCount,
        "Status": error.status,
      },
      timestamp: new Date(),
    };

    return await sendEmailNotification(alert);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send manual review required alert
 */
export async function sendManualReviewAlert(patchId: number): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    const [patch] = await db
      .select()
      .from(aecPatches)
      .where(eq(aecPatches.id, patchId))
      .limit(1);

    if (!patch) {
      return { success: false, error: "Patch not found" };
    }

    const [diagnostic] = await db
      .select()
      .from(aecDiagnostics)
      .where(eq(aecDiagnostics.errorId, patch.errorId))
      .limit(1);

    const alert: Alert = {
      type: "manual_review_required",
      priority: "high",
      title: `Manual Review Required for Patch #${patchId}`,
      message: `A code patch has been generated but requires manual review before deployment. This patch affects critical medical pathways or has high impact.`,
      details: {
        "Patch ID": patchId,
        "Error ID": patch.errorId,
        "Impact Level": diagnostic?.impact || "Unknown",
        "Affected Features": diagnostic?.affectedFeatures?.join(", ") || "Unknown",
        "Files Modified": patch.filesModified?.length || 0,
        "Branch Name": patch.branchName,
        "Created At": patch.createdAt?.toLocaleString(),
        "Reason": "High impact or medical pathway affected",
      },
      timestamp: new Date(),
    };

    return await sendEmailNotification(alert);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send patch generated alert
 */
export async function sendPatchGeneratedAlert(patchId: number): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    const [patch] = await db
      .select()
      .from(aecPatches)
      .where(eq(aecPatches.id, patchId))
      .limit(1);

    if (!patch) {
      return { success: false, error: "Patch not found" };
    }

    const alert: Alert = {
      type: "patch_generated",
      priority: "medium",
      title: `Code Patch Generated: #${patchId}`,
      message: `AEC has successfully generated a code patch to fix a detected error.`,
      details: {
        "Patch ID": patchId,
        "Error ID": patch.errorId,
        "Files Modified": patch.filesModified?.length || 0,
        "Branch Name": patch.branchName,
        "Status": patch.status,
        "Created At": patch.createdAt?.toLocaleString(),
      },
      timestamp: new Date(),
    };

    return await sendEmailNotification(alert);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send deployment success alert
 */
export async function sendDeploymentSuccessAlert(patchId: number): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    const [patch] = await db
      .select()
      .from(aecPatches)
      .where(eq(aecPatches.id, patchId))
      .limit(1);

    if (!patch) {
      return { success: false, error: "Patch not found" };
    }

    const alert: Alert = {
      type: "deployment_success",
      priority: "low",
      title: `Deployment Successful: Patch #${patchId}`,
      message: `A code patch has been successfully deployed to production. The system is now running with the fix applied.`,
      details: {
        "Patch ID": patchId,
        "Error ID": patch.errorId,
        "Deployed At": patch.deployedAt?.toLocaleString(),
        "Files Modified": patch.filesModified?.length || 0,
        "Tests Passed": patch.testResults ? "Yes" : "N/A",
      },
      timestamp: new Date(),
    };

    return await sendEmailNotification(alert);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send deployment failed alert
 */
export async function sendDeploymentFailedAlert(
  patchId: number,
  reason: string
): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    const [patch] = await db
      .select()
      .from(aecPatches)
      .where(eq(aecPatches.id, patchId))
      .limit(1);

    if (!patch) {
      return { success: false, error: "Patch not found" };
    }

    const alert: Alert = {
      type: "deployment_failed",
      priority: "high",
      title: `Deployment Failed: Patch #${patchId}`,
      message: `A code patch deployment has failed. Manual intervention may be required.`,
      details: {
        "Patch ID": patchId,
        "Error ID": patch.errorId,
        "Failure Reason": reason,
        "Files Modified": patch.filesModified?.length || 0,
        "Status": patch.status,
      },
      timestamp: new Date(),
    };

    return await sendEmailNotification(alert);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send rollback triggered alert
 */
export async function sendRollbackAlert(patchId: number, reason: string): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    const [patch] = await db
      .select()
      .from(aecPatches)
      .where(eq(aecPatches.id, patchId))
      .limit(1);

    if (!patch) {
      return { success: false, error: "Patch not found" };
    }

    const alert: Alert = {
      type: "rollback_triggered",
      priority: "critical",
      title: `Rollback Triggered: Patch #${patchId}`,
      message: `A deployed patch has been automatically rolled back due to health check failures or errors. The system has been restored to the previous state.`,
      details: {
        "Patch ID": patchId,
        "Error ID": patch.errorId,
        "Rollback Reason": reason,
        "Deployed At": patch.deployedAt?.toLocaleString(),
        "Rolled Back At": new Date().toLocaleString(),
      },
      timestamp: new Date(),
    };

    return await sendEmailNotification(alert);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send health check failed alert
 */
export async function sendHealthCheckFailedAlert(
  checks: Record<string, boolean>
): Promise<NotificationResult> {
  const failedChecks = Object.entries(checks)
    .filter(([_, passed]) => !passed)
    .map(([name]) => name);

  const alert: Alert = {
    type: "health_check_failed",
    priority: "critical",
    title: `Health Check Failed`,
    message: `Post-deployment health checks have failed. The system may be experiencing issues.`,
    details: {
      "Failed Checks": failedChecks.join(", "),
      "Total Checks": Object.keys(checks).length,
      "Failed Count": failedChecks.length,
      "Time": new Date().toLocaleString(),
    },
    timestamp: new Date(),
  };

  return await sendEmailNotification(alert);
}
