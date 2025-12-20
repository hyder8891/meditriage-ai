/**
 * AEC Alert System - Main Entry Point
 * Initializes notification service and daily report scheduler
 */

import { scheduleDailyReports, sendDailyReport } from "./report-generator";

/**
 * Initialize AEC alert system
 * Call this when the server starts
 */
export function initializeAlertSystem(): void {
  console.log("[AEC Alerts] Initializing alert system...");

  try {
    // Schedule daily reports (8 AM and 8 PM)
    scheduleDailyReports();

    console.log("[AEC Alerts] ✅ Alert system initialized successfully");
    console.log("[AEC Alerts] Daily reports scheduled:");
    console.log("  - Morning report: 8:00 AM (overnight summary)");
    console.log("  - Evening report: 8:00 PM (daytime summary)");
  } catch (error) {
    console.error("[AEC Alerts] ❌ Failed to initialize alert system:", error);
  }
}

/**
 * Send a test report immediately (for testing purposes)
 */
export async function sendTestReport(period: "morning" | "evening" = "morning"): Promise<boolean> {
  console.log(`[AEC Alerts] Sending test ${period} report...`);
  return await sendDailyReport(period);
}

// Export all notification functions for use in other modules
export * from "./notification-service";
export * from "./report-generator";
