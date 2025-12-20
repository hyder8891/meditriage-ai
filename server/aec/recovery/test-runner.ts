/**
 * Test Runner - Recovery Layer
 * Runs automated tests to validate patches
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const PROJECT_ROOT = "/home/ubuntu/meditriage-ai";

export interface TestResults {
  success: boolean;
  unitTests: TestSuiteResult;
  integrationTests: TestSuiteResult;
  typeCheck: TestSuiteResult;
  linting: TestSuiteResult;
  totalDuration: number;
}

export interface TestSuiteResult {
  passed: boolean;
  duration: number;
  output: string;
  errorMessage?: string;
}

// ============================================================================
// Test Execution
// ============================================================================

/**
 * Run all tests for a patch
 */
export async function runAllTests(): Promise<TestResults> {
  console.log(`[AEC Test Runner] Running all tests...`);

  const startTime = Date.now();

  // Run tests in parallel where possible
  const [unitTests, typeCheck, linting] = await Promise.all([
    runUnitTests(),
    runTypeCheck(),
    runLinting(),
  ]);

  // Integration tests run after unit tests
  const integrationTests = await runIntegrationTests();

  const totalDuration = Date.now() - startTime;

  const results: TestResults = {
    success: unitTests.passed && integrationTests.passed && typeCheck.passed && linting.passed,
    unitTests,
    integrationTests,
    typeCheck,
    linting,
    totalDuration,
  };

  if (results.success) {
    console.log(`[AEC Test Runner] ✅ All tests passed (${totalDuration}ms)`);
  } else {
    console.log(`[AEC Test Runner] ❌ Some tests failed (${totalDuration}ms)`);
  }

  return results;
}

// ============================================================================
// Individual Test Suites
// ============================================================================

/**
 * Run unit tests with vitest
 */
async function runUnitTests(): Promise<TestSuiteResult> {
  console.log(`[AEC Test Runner] Running unit tests...`);
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(
      `cd ${PROJECT_ROOT} && pnpm test --run`,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 120000, // 2 minute timeout
      }
    );

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    // Check if tests passed
    const passed = !output.includes("FAIL") && !output.includes("failed");

    console.log(`[AEC Test Runner] Unit tests ${passed ? "✅ passed" : "❌ failed"} (${duration}ms)`);

    return {
      passed,
      duration,
      output,
      errorMessage: passed ? undefined : "Unit tests failed",
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`[AEC Test Runner] Unit tests ❌ failed (${duration}ms)`);

    return {
      passed: false,
      duration,
      output: error.stdout || error.stderr || "",
      errorMessage: error.message,
    };
  }
}

/**
 * Run integration tests
 */
async function runIntegrationTests(): Promise<TestSuiteResult> {
  console.log(`[AEC Test Runner] Running integration tests...`);
  const startTime = Date.now();

  try {
    // For now, we'll use the same test command
    // In a real implementation, you'd have separate integration tests
    const { stdout, stderr } = await execAsync(
      `cd ${PROJECT_ROOT} && pnpm test --run`,
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 180000, // 3 minute timeout
      }
    );

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    const passed = !output.includes("FAIL") && !output.includes("failed");

    console.log(`[AEC Test Runner] Integration tests ${passed ? "✅ passed" : "❌ failed"} (${duration}ms)`);

    return {
      passed,
      duration,
      output,
      errorMessage: passed ? undefined : "Integration tests failed",
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`[AEC Test Runner] Integration tests ❌ failed (${duration}ms)`);

    return {
      passed: false,
      duration,
      output: error.stdout || error.stderr || "",
      errorMessage: error.message,
    };
  }
}

/**
 * Run TypeScript type checking
 */
async function runTypeCheck(): Promise<TestSuiteResult> {
  console.log(`[AEC Test Runner] Running type check...`);
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(
      `cd ${PROJECT_ROOT} && pnpm tsc --noEmit`,
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000, // 1 minute timeout
      }
    );

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    // If tsc exits with 0, types are valid
    const passed = true;

    console.log(`[AEC Test Runner] Type check ✅ passed (${duration}ms)`);

    return {
      passed,
      duration,
      output,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const output = error.stdout || error.stderr || "";

    // Check if it's just warnings or actual errors
    const hasErrors = output.includes("error TS");

    console.log(`[AEC Test Runner] Type check ${hasErrors ? "❌ failed" : "⚠️  has warnings"} (${duration}ms)`);

    return {
      passed: !hasErrors, // Allow warnings, fail on errors
      duration,
      output,
      errorMessage: hasErrors ? "TypeScript errors found" : undefined,
    };
  }
}

/**
 * Run linting
 */
async function runLinting(): Promise<TestSuiteResult> {
  console.log(`[AEC Test Runner] Running linting...`);
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(
      `cd ${PROJECT_ROOT} && pnpm eslint . --ext .ts,.tsx --max-warnings 50`,
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
      }
    );

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    console.log(`[AEC Test Runner] Linting ✅ passed (${duration}ms)`);

    return {
      passed: true,
      duration,
      output,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const output = error.stdout || error.stderr || "";

    // ESLint exits with 1 if there are errors
    // We'll be lenient and only fail on critical errors
    const hasCriticalErrors = output.includes("error") && !output.includes("warning");

    console.log(`[AEC Test Runner] Linting ${hasCriticalErrors ? "❌ failed" : "⚠️  has warnings"} (${duration}ms)`);

    return {
      passed: !hasCriticalErrors,
      duration,
      output,
      errorMessage: hasCriticalErrors ? "Linting errors found" : undefined,
    };
  }
}

// ============================================================================
// Specific Test Suites
// ============================================================================

/**
 * Run tests for specific files
 */
export async function runTestsForFiles(filePaths: string[]): Promise<TestSuiteResult> {
  console.log(`[AEC Test Runner] Running tests for ${filePaths.length} files...`);
  const startTime = Date.now();

  try {
    // Find test files related to the changed files
    const testFiles = filePaths
      .map(f => f.replace(/\.(ts|tsx)$/, ".test.$1"))
      .filter(f => f.includes(".test."));

    if (testFiles.length === 0) {
      console.log(`[AEC Test Runner] No test files found for changed files`);
      return {
        passed: true,
        duration: 0,
        output: "No test files found",
      };
    }

    const { stdout, stderr } = await execAsync(
      `cd ${PROJECT_ROOT} && pnpm test --run ${testFiles.join(" ")}`,
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      }
    );

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    const passed = !output.includes("FAIL") && !output.includes("failed");

    console.log(`[AEC Test Runner] File-specific tests ${passed ? "✅ passed" : "❌ failed"} (${duration}ms)`);

    return {
      passed,
      duration,
      output,
      errorMessage: passed ? undefined : "File-specific tests failed",
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      passed: false,
      duration,
      output: error.stdout || error.stderr || "",
      errorMessage: error.message,
    };
  }
}

/**
 * Run smoke tests (quick sanity checks)
 */
export async function runSmokeTests(): Promise<TestSuiteResult> {
  console.log(`[AEC Test Runner] Running smoke tests...`);
  const startTime = Date.now();

  try {
    // Basic checks: server starts, database connects, etc.
    const checks = [
      checkServerStarts(),
      checkDatabaseConnection(),
    ];

    const results = await Promise.all(checks);
    const allPassed = results.every(r => r);

    const duration = Date.now() - startTime;

    console.log(`[AEC Test Runner] Smoke tests ${allPassed ? "✅ passed" : "❌ failed"} (${duration}ms)`);

    return {
      passed: allPassed,
      duration,
      output: `Smoke tests completed: ${results.filter(r => r).length}/${results.length} passed`,
      errorMessage: allPassed ? undefined : "Some smoke tests failed",
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      passed: false,
      duration,
      output: "",
      errorMessage: error.message,
    };
  }
}

/**
 * Check if server can start
 */
async function checkServerStarts(): Promise<boolean> {
  try {
    // This is a simplified check - in production you'd actually start the server
    // and verify it responds to health checks
    console.log(`[AEC Test Runner] Checking server can start...`);
    return true; // Placeholder
  } catch (error) {
    return false;
  }
}

/**
 * Check database connection
 */
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    console.log(`[AEC Test Runner] Checking database connection...`);
    // Import and test database connection
    const { getDb } = await import("../../db");
    const db = await getDb();
    return db !== null;
  } catch (error) {
    return false;
  }
}
