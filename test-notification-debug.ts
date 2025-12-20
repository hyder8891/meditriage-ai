/**
 * Notification System Diagnostic Test
 * Run with: pnpm exec tsx test-notification-debug.ts
 */

import "dotenv/config";
import { ENV } from "./server/_core/env";

console.log("=".repeat(70));
console.log("AEC Notification System - Diagnostic Test");
console.log("=".repeat(70));
console.log("");

async function runDiagnostics() {
  console.log("🔍 Checking notification service configuration...");
  console.log("");

  // Check environment variables
  console.log("Environment Variables:");
  console.log(`  BUILT_IN_FORGE_API_URL: ${ENV.forgeApiUrl ? "✅ Set" : "❌ Missing"}`);
  console.log(`  BUILT_IN_FORGE_API_KEY: ${ENV.forgeApiKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`  OWNER_NAME: ${ENV.ownerName || "Not set"}`);
  console.log(`  OWNER_OPEN_ID: ${ENV.ownerOpenId || "Not set"}`);
  console.log("");

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.error("❌ Notification service is not properly configured!");
    console.error("Missing required environment variables.");
    process.exit(1);
  }

  // Build endpoint URL
  const normalizedBase = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const endpoint = new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();

  console.log("📡 Notification Service Details:");
  console.log(`  Base URL: ${ENV.forgeApiUrl}`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  API Key: ${ENV.forgeApiKey.substring(0, 20)}...`);
  console.log("");

  // Test notification
  console.log("📧 Sending test notification...");
  console.log("");

  const payload = {
    title: "🧪 AEC Alert System - Diagnostic Test",
    content: `
This is a diagnostic test of the AEC Alert System notification service.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || "development"}
- Owner: ${ENV.ownerName || "Unknown"}

If you receive this email, the notification system is working correctly!

═══════════════════════════════════════════════════════════════════
This is an automated test from the AEC Self-Healing System.
═══════════════════════════════════════════════════════════════════
    `.trim(),
  };

  try {
    console.log("Request payload:");
    console.log(`  Title: ${payload.title}`);
    console.log(`  Content length: ${payload.content.length} characters`);
    console.log("");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify(payload),
    });

    console.log("Response:");
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    console.log("");

    const responseText = await response.text();
    console.log("Response body:");
    console.log(responseText || "(empty)");
    console.log("");

    console.log("=".repeat(70));
    if (response.ok) {
      console.log("✅ Notification sent successfully!");
      console.log("");
      console.log("📬 Check your email for:");
      console.log("   Subject: 🧪 AEC Alert System - Diagnostic Test");
      console.log("");
      console.log("If you don't receive the email:");
      console.log("  1. Check your spam/junk folder");
      console.log("  2. Verify your email address in Manus account settings");
      console.log("  3. Check if notifications are enabled in your Manus project settings");
    } else {
      console.log("❌ Notification failed!");
      console.log("");
      console.log("Possible issues:");
      console.log("  • API endpoint returned error status");
      console.log("  • Invalid API key or permissions");
      console.log("  • Notification service temporarily unavailable");
      console.log("  • Owner email not configured in Manus");
    }
    console.log("=".repeat(70));

    process.exit(response.ok ? 0 : 1);
  } catch (error: any) {
    console.error("");
    console.error("=".repeat(70));
    console.error("❌ Error sending notification:");
    console.error(error.message);
    console.error("");
    console.error("Stack trace:");
    console.error(error.stack);
    console.error("=".repeat(70));
    process.exit(1);
  }
}

runDiagnostics();
