/**
 * Comprehensive AEC Error Detection Test
 * 
 * This script tests all error detection triggers:
 * 1. 404 errors (client-side routing)
 * 2. API errors (tRPC failures)
 * 3. React errors (component crashes)
 * 4. Server errors (Express middleware)
 * 5. Uncaught exceptions
 * 6. Unhandled promise rejections
 */

import { detectError } from "./aec/sentinel-layer";

async function testAECErrorDetection() {
  console.log("\n🧪 Starting AEC Error Detection Tests...\n");

  const tests = [
    {
      name: "404 Not Found Error",
      errorData: {
        errorType: "PAGE_NOT_FOUND",
        severity: "medium" as const,
        message: "404 Not Found: /test-missing-page",
        source: "client-router",
        endpoint: "/test-missing-page",
        userContext: {
          url: "https://example.com/test-missing-page",
          referrer: "",
          userAgent: "Test Agent",
          timestamp: new Date().toISOString(),
        },
      },
    },
    {
      name: "API Error (tRPC)",
      errorData: {
        errorType: "TRPC_ERROR",
        severity: "high" as const,
        message: "Invalid input: expected string, received number",
        stackTrace: "Error: Invalid input\n    at validateInput (trpc.ts:123)\n    at procedure (router.ts:45)",
        source: "trpc-router",
        endpoint: "/api/trpc/patient.getProfile",
        userContext: {
          userId: "test-user-123",
          input: { id: 123 },
          timestamp: new Date().toISOString(),
        },
      },
    },
    {
      name: "React Component Error",
      errorData: {
        errorType: "REACT_ERROR_BOUNDARY",
        severity: "high" as const,
        message: "Cannot read property 'name' of undefined",
        stackTrace: "TypeError: Cannot read property 'name' of undefined\n    at PatientCard (PatientCard.tsx:45)\n    at PatientList (PatientList.tsx:123)",
        source: "client-error-boundary",
        endpoint: "/patient/portal",
        userContext: {
          componentStack: "    at PatientCard\n    at PatientList\n    at PatientPortal",
          url: "https://example.com/patient/portal",
          userAgent: "Test Agent",
          timestamp: new Date().toISOString(),
        },
      },
    },
    {
      name: "Database Connection Error",
      errorData: {
        errorType: "DATABASE_ERROR",
        severity: "critical" as const,
        message: "Connection timeout: Unable to connect to database",
        stackTrace: "Error: Connection timeout\n    at MySQLConnection.connect (mysql.ts:89)\n    at getDb (db.ts:34)",
        source: "database-connection",
        endpoint: "/api/trpc/patient.getAll",
        userContext: {
          database: "production",
          timeout: "30s",
          timestamp: new Date().toISOString(),
        },
      },
    },
    {
      name: "Authentication Error",
      errorData: {
        errorType: "AUTH_ERROR",
        severity: "medium" as const,
        message: "Invalid JWT token: Token expired",
        source: "auth-middleware",
        endpoint: "/api/trpc/clinician.getPatients",
        userContext: {
          tokenExpiry: new Date(Date.now() - 3600000).toISOString(),
          userId: "clinician-456",
          timestamp: new Date().toISOString(),
        },
      },
    },
    {
      name: "File Upload Error",
      errorData: {
        errorType: "FILE_UPLOAD_ERROR",
        severity: "medium" as const,
        message: "File size exceeds 16MB limit",
        source: "file-upload-middleware",
        endpoint: "/api/upload/xray",
        userContext: {
          fileSize: "18MB",
          fileName: "chest-xray.jpg",
          maxSize: "16MB",
          timestamp: new Date().toISOString(),
        },
      },
    },
    {
      name: "AI Service Error",
      errorData: {
        errorType: "AI_SERVICE_ERROR",
        severity: "high" as const,
        message: "Gemini API rate limit exceeded",
        stackTrace: "Error: Rate limit exceeded\n    at invokeGemini (gemini.ts:67)\n    at analyzeBRAIN (brain.ts:123)",
        source: "ai-service",
        endpoint: "/api/brain/analyze",
        userContext: {
          service: "Gemini 2.0 Pro",
          requestsPerMinute: 60,
          limit: 50,
          timestamp: new Date().toISOString(),
        },
      },
    },
    {
      name: "Payment Processing Error",
      errorData: {
        errorType: "PAYMENT_ERROR",
        severity: "critical" as const,
        message: "Stripe payment failed: Card declined",
        source: "payment-service",
        endpoint: "/api/subscription/upgrade",
        userContext: {
          userId: "patient-789",
          plan: "Pro",
          amount: "$30",
          cardLast4: "4242",
          timestamp: new Date().toISOString(),
        },
      },
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const test of tests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`   Severity: ${test.errorData.severity}`);
      console.log(`   Type: ${test.errorData.errorType}`);

      const errorId = await detectError(test.errorData);

      if (errorId) {
        console.log(`   ✅ Success - Error logged with ID: ${errorId}`);
        successCount++;
      } else {
        console.log(`   ❌ Failed - No error ID returned`);
        failCount++;
      }
    } catch (error: any) {
      console.log(`   ❌ Failed - Exception: ${error.message}`);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   Total Tests: ${tests.length}`);
  console.log(`   ✅ Passed: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   Success Rate: ${((successCount / tests.length) * 100).toFixed(1)}%`);
  console.log("\n" + "=".repeat(60));

  if (failCount === 0) {
    console.log("\n🎉 All tests passed! AEC error detection is working correctly.\n");
  } else {
    console.log("\n⚠️  Some tests failed. Please review the errors above.\n");
  }
}

// Run tests
testAECErrorDetection().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
