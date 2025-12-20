/**
 * Test Email Formatting - Sends a mock alert to verify email delivery
 * Run with: pnpm exec tsx test-email-format.ts
 */

import "dotenv/config";
import { notifyOwner } from "./server/_core/notification";

console.log("=".repeat(70));
console.log("AEC Alert System - Email Format Test");
console.log("=".repeat(70));
console.log("");

async function sendMockAlert() {
  const mockReport = `
═══════════════════════════════════════════════════════════════════
📊 AEC DAILY REPORT - Morning Report
═══════════════════════════════════════════════════════════════════
Period: December 19, 2025 8:00 PM to December 20, 2025 8:00 AM
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════════
📈 EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════
Total Errors Detected: 0
  └─ Critical: 0 🔴
  └─ High: 0 🟠
  └─ Resolved: 0 ✅

Patches Generated: 0
Patches Deployed: 0
Rollbacks: 0
Health Check Failures: 0

═══════════════════════════════════════════════════════════════════
🏥 SYSTEM HEALTH
═══════════════════════════════════════════════════════════════════
API Health: ✅ Healthy
Database: ✅ Connected
Critical Endpoints: ✅ All Responding
Last Check: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════════
✨ NO ERRORS DETECTED
═══════════════════════════════════════════════════════════════════
The system has been running smoothly during this period.
No critical errors or issues detected.

═══════════════════════════════════════════════════════════════════
💻 CODE CHANGES & PATCHES
═══════════════════════════════════════════════════════════════════
No patches were generated or deployed during this period.

═══════════════════════════════════════════════════════════════════
📝 NOTES
═══════════════════════════════════════════════════════════════════
• This is a TEST report to verify email delivery and formatting
• The AEC alert system is operational and monitoring for errors
• Twice-daily reports will be sent at 8:00 AM and 8:00 PM
• Real-time alerts will be sent for critical errors and deployments

═══════════════════════════════════════════════════════════════════
This is an automated notification from the AEC Self-Healing System.
For questions or issues, check the AEC_ALERT_SYSTEM.md documentation.
═══════════════════════════════════════════════════════════════════
  `.trim();

  console.log("📧 Sending test email alert...");
  console.log("");

  try {
    const success = await notifyOwner({
      title: "🧪 AEC Alert System Test - Morning Report",
      content: mockReport,
    });

    console.log("");
    console.log("=".repeat(70));
    if (success) {
      console.log("✅ Test email sent successfully!");
      console.log("");
      console.log("📬 Check your email inbox for:");
      console.log("   Subject: 🧪 AEC Alert System Test - Morning Report");
      console.log("");
      console.log("The email should contain:");
      console.log("  • Executive summary section");
      console.log("  • System health status");
      console.log("  • Error details (none in this test)");
      console.log("  • Code changes section");
      console.log("  • Formatted with proper spacing and emojis");
    } else {
      console.log("❌ Test email failed to send.");
      console.log("");
      console.log("Possible reasons:");
      console.log("  • Manus notification API unavailable");
      console.log("  • Email service configuration issue");
      console.log("  • Network connectivity problem");
    }
    console.log("=".repeat(70));

    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error("");
    console.error("=".repeat(70));
    console.error("❌ Error sending test email:");
    console.error(error.message);
    console.error("=".repeat(70));
    process.exit(1);
  }
}

sendMockAlert();
