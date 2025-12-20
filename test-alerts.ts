/**
 * Test script for AEC Alert System
 * Run with: tsx test-alerts.ts
 */

import "dotenv/config";
import { sendTestReport } from "./server/aec/alerts/index";

console.log("=".repeat(60));
console.log("AEC Alert System Test");
console.log("=".repeat(60));
console.log("");

async function runTest() {
  console.log("📧 Sending test morning report...");
  console.log("");

  try {
    const success = await sendTestReport("morning");
    
    console.log("");
    console.log("=".repeat(60));
    if (success) {
      console.log("✅ Test report sent successfully!");
      console.log("📬 Check your email for the morning report.");
      console.log("");
      console.log("The report includes:");
      console.log("  • Executive summary of errors and patches");
      console.log("  • System health status");
      console.log("  • Detailed error list");
      console.log("  • Code changes and deployments");
    } else {
      console.log("❌ Test report failed to send.");
      console.log("Check server logs for details.");
    }
    console.log("=".repeat(60));
    
    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error("");
    console.error("=".repeat(60));
    console.error("❌ Error sending test report:");
    console.error(error.message);
    console.error("=".repeat(60));
    process.exit(1);
  }
}

runTest();
