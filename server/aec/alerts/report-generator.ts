/**
 * AEC Daily Report Generator
 * Generates comprehensive twice-daily reports on system health, errors, and code changes
 */

import { getDb } from "../../db";
import { aecDetectedErrors, aecDiagnostics, aecPatches, aecHealthChecks } from "../../../drizzle/schema";
import { gte, and, eq, desc } from "drizzle-orm";
import { sendEmailNotification, Alert } from "./notification-service";
import cron from "node-cron";

// ============================================================================
// Report Types
// ============================================================================

export interface DailyReportData {
  period: "morning" | "evening";
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalErrors: number;
    criticalErrors: number;
    errorsResolved: number;
    patchesGenerated: number;
    patchesDeployed: number;
    deploymentsRolledBack: number;
    healthCheckFailures: number;
  };
  errors: Array<{
    id: number;
    type: string;
    severity: string;
    message: string;
    occurrences: number;
    status: string;
    firstOccurred: Date;
  }>;
  patches: Array<{
    id: number;
    errorId: number;
    status: string;
    filesModified: number;
    createdAt: Date;
    deployedAt?: Date;
  }>;
  codeChanges: Array<{
    patchId: number;
    files: string[];
    impact: string;
    timestamp: Date;
  }>;
  healthStatus: {
    apiHealthy: boolean;
    databaseHealthy: boolean;
    criticalEndpointsHealthy: boolean;
    lastCheckTime: Date;
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate daily report for a specific time period
 */
export async function generateDailyReport(period: "morning" | "evening"): Promise<DailyReportData | null> {
  const db = await getDb();
  if (!db) {
    console.error("[AEC Reports] Database unavailable");
    return null;
  }

  try {
    // Determine time range
    const timeRange = getTimeRange(period);
    console.log(`[AEC Reports] Generating ${period} report for ${timeRange.start.toLocaleString()} to ${timeRange.end.toLocaleString()}`);

    // Fetch errors in time range
    const errors = await db
      .select()
      .from(aecDetectedErrors)
      .where(gte(aecDetectedErrors.firstOccurrence, timeRange.start))
      .orderBy(desc(aecDetectedErrors.severity), desc(aecDetectedErrors.firstOccurrence));

    // Fetch patches in time range
    const patches = await db
      .select()
      .from(aecPatches)
      .where(gte(aecPatches.createdAt, timeRange.start))
      .orderBy(desc(aecPatches.createdAt));

    // Fetch latest health check
    const [latestHealthCheck] = await db
      .select()
      .from(aecHealthChecks)
      .orderBy(desc(aecHealthChecks.timestamp))
      .limit(1);

    // Calculate summary statistics
    const summary = {
      totalErrors: errors.length,
      criticalErrors: errors.filter(e => e.severity === "critical").length,
      errorsResolved: errors.filter(e => e.status === "resolved").length,
      patchesGenerated: patches.length,
      patchesDeployed: patches.filter(p => p.status === "deployed").length,
      deploymentsRolledBack: patches.filter(p => p.status === "rolled_back").length,
      healthCheckFailures: errors.filter(e => e.errorType === "HEALTH_CHECK_FAILED").length,
    };

    // Map errors for report
    const errorsList = errors.map(e => ({
      id: e.id,
      type: e.errorType,
      severity: e.severity,
      message: e.message,
      occurrences: e.occurrenceCount,
      status: e.status,
      firstOccurred: e.firstOccurrence!,
    }));

    // Map patches for report
    const patchesList = patches.map(p => ({
      id: p.id,
      errorId: p.errorId,
      status: p.status,
      filesModified: p.filesModified?.length || 0,
      createdAt: p.createdAt!,
      deployedAt: p.deployedAt || undefined,
    }));

    // Extract code changes from patches
    const codeChanges = await Promise.all(
      patches.map(async (p) => {
        const [diagnostic] = await db
          .select()
          .from(aecDiagnostics)
          .where(eq(aecDiagnostics.errorId, p.errorId))
          .limit(1);

        return {
          patchId: p.id,
          files: p.filesModified || [],
          impact: diagnostic?.impact || "unknown",
          timestamp: p.createdAt!,
        };
      })
    );

    // Health status
    const healthStatus = {
      apiHealthy: latestHealthCheck?.status === "healthy" || false,
      databaseHealthy: latestHealthCheck?.responseTime ? latestHealthCheck.responseTime < 5000 : false,
      criticalEndpointsHealthy: latestHealthCheck?.status === "healthy" || false,
      lastCheckTime: latestHealthCheck?.timestamp || new Date(),
    };

    const report: DailyReportData = {
      period,
      timeRange,
      summary,
      errors: errorsList,
      patches: patchesList,
      codeChanges,
      healthStatus,
    };

    return report;
  } catch (error) {
    console.error("[AEC Reports] Error generating report:", error);
    return null;
  }
}

/**
 * Get time range for report period
 */
function getTimeRange(period: "morning" | "evening"): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);

  if (period === "morning") {
    // Morning report: 8 PM yesterday to 8 AM today
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(20, 0, 0, 0);
    end.setHours(8, 0, 0, 0);
    return { start, end };
  } else {
    // Evening report: 8 AM today to 8 PM today
    const start = new Date(now);
    start.setHours(8, 0, 0, 0);
    end.setHours(20, 0, 0, 0);
    return { start, end };
  }
}

/**
 * Format report as email content
 */
export function formatReportEmail(report: DailyReportData): string {
  const lines: string[] = [];

  // Header
  lines.push(`📊 AEC Daily Report - ${report.period === "morning" ? "Morning" : "Evening"}`);
  lines.push(`Period: ${report.timeRange.start.toLocaleString()} to ${report.timeRange.end.toLocaleString()}`);
  lines.push("");

  // Executive Summary
  lines.push("═══════════════════════════════════════");
  lines.push("📈 EXECUTIVE SUMMARY");
  lines.push("═══════════════════════════════════════");
  lines.push(`Total Errors Detected: ${report.summary.totalErrors}`);
  lines.push(`  └─ Critical: ${report.summary.criticalErrors} 🔴`);
  lines.push(`  └─ Resolved: ${report.summary.errorsResolved} ✅`);
  lines.push(`Patches Generated: ${report.summary.patchesGenerated}`);
  lines.push(`Patches Deployed: ${report.summary.patchesDeployed}`);
  lines.push(`Rollbacks: ${report.summary.deploymentsRolledBack}`);
  lines.push(`Health Check Failures: ${report.summary.healthCheckFailures}`);
  lines.push("");

  // System Health
  lines.push("═══════════════════════════════════════");
  lines.push("🏥 SYSTEM HEALTH");
  lines.push("═══════════════════════════════════════");
  lines.push(`API Health: ${report.healthStatus.apiHealthy ? "✅ Healthy" : "❌ Unhealthy"}`);
  lines.push(`Database: ${report.healthStatus.databaseHealthy ? "✅ Connected" : "❌ Issues Detected"}`);
  lines.push(`Critical Endpoints: ${report.healthStatus.criticalEndpointsHealthy ? "✅ All Responding" : "❌ Some Failing"}`);
  lines.push(`Last Check: ${report.healthStatus.lastCheckTime.toLocaleString()}`);
  lines.push("");

  // Errors Section
  if (report.errors.length > 0) {
    lines.push("═══════════════════════════════════════");
    lines.push("🐛 ERRORS DETECTED");
    lines.push("═══════════════════════════════════════");
    
    report.errors.slice(0, 10).forEach((error, index) => {
      const severityEmoji = error.severity === "critical" ? "🔴" : error.severity === "high" ? "🟠" : "🟡";
      lines.push(`${index + 1}. [${error.id}] ${severityEmoji} ${error.type}`);
      lines.push(`   Message: ${error.message.substring(0, 100)}${error.message.length > 100 ? "..." : ""}`);
      lines.push(`   Severity: ${error.severity} | Status: ${error.status} | Occurrences: ${error.occurrences}`);
      lines.push(`   First Occurred: ${error.firstOccurred.toLocaleString()}`);
      lines.push("");
    });

    if (report.errors.length > 10) {
      lines.push(`... and ${report.errors.length - 10} more errors`);
      lines.push("");
    }
  } else {
    lines.push("═══════════════════════════════════════");
    lines.push("✅ NO ERRORS DETECTED");
    lines.push("═══════════════════════════════════════");
    lines.push("The system has been running smoothly with no errors detected during this period.");
    lines.push("");
  }

  // Code Changes Section
  if (report.codeChanges.length > 0) {
    lines.push("═══════════════════════════════════════");
    lines.push("💻 CODE CHANGES & PATCHES");
    lines.push("═══════════════════════════════════════");
    
    report.patches.forEach((patch, index) => {
      const change = report.codeChanges.find(c => c.patchId === patch.id);
      const statusEmoji = patch.status === "deployed" ? "✅" : patch.status === "rolled_back" ? "🔄" : "⏳";
      
      lines.push(`${index + 1}. Patch #${patch.id} ${statusEmoji}`);
      lines.push(`   Error ID: ${patch.errorId}`);
      lines.push(`   Status: ${patch.status}`);
      lines.push(`   Files Modified: ${patch.filesModified}`);
      lines.push(`   Impact: ${change?.impact || "unknown"}`);
      lines.push(`   Created: ${patch.createdAt.toLocaleString()}`);
      if (patch.deployedAt) {
        lines.push(`   Deployed: ${patch.deployedAt.toLocaleString()}`);
      }
      if (change && change.files.length > 0) {
        lines.push(`   Files: ${change.files.slice(0, 3).join(", ")}${change.files.length > 3 ? "..." : ""}`);
      }
      lines.push("");
    });
  } else {
    lines.push("═══════════════════════════════════════");
    lines.push("💻 CODE CHANGES");
    lines.push("═══════════════════════════════════════");
    lines.push("No code changes or patches were generated during this period.");
    lines.push("");
  }

  // Footer
  lines.push("═══════════════════════════════════════");
  lines.push("This is an automated report from the AEC Self-Healing System.");
  lines.push("For detailed information, check the AEC dashboard or server logs.");
  lines.push("═══════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Send daily report via email
 */
export async function sendDailyReport(period: "morning" | "evening"): Promise<boolean> {
  console.log(`[AEC Reports] Generating and sending ${period} report...`);

  const report = await generateDailyReport(period);
  
  if (!report) {
    console.error(`[AEC Reports] Failed to generate ${period} report`);
    return false;
  }

  const emailContent = formatReportEmail(report);

  const alert: Alert = {
    type: "daily_report",
    priority: report.summary.criticalErrors > 0 ? "high" : "low",
    title: `AEC Daily Report - ${period === "morning" ? "Morning" : "Evening"} (${new Date().toLocaleDateString()})`,
    message: emailContent,
    timestamp: new Date(),
  };

  const result = await sendEmailNotification(alert);
  
  if (result.success) {
    console.log(`[AEC Reports] ${period} report sent successfully`);
  } else {
    console.error(`[AEC Reports] Failed to send ${period} report:`, result.error);
  }

  return result.success;
}

// ============================================================================
// Scheduler
// ============================================================================

/**
 * Schedule daily reports
 * Morning report: 8:00 AM (overnight summary)
 * Evening report: 8:00 PM (daytime summary)
 */
export function scheduleDailyReports(): void {
  console.log("[AEC Reports] Scheduling daily reports...");

  // Morning report at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[AEC Reports] Triggering morning report...");
    await sendDailyReport("morning");
  });

  // Evening report at 8:00 PM (20:00)
  cron.schedule("0 20 * * *", async () => {
    console.log("[AEC Reports] Triggering evening report...");
    await sendDailyReport("evening");
  });

  console.log("[AEC Reports] ✅ Daily reports scheduled:");
  console.log("  - Morning report: 8:00 AM (overnight summary)");
  console.log("  - Evening report: 8:00 PM (daytime summary)");
}
