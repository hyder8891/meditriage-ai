/**
 * AEC Alert System Tests
 * Tests notification service, report generation, and alert triggers
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../../db";
import { aecDetectedErrors, aecDiagnostics, aecPatches, aecHealthChecks } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  sendCriticalErrorAlert,
  sendManualReviewAlert,
  sendPatchGeneratedAlert,
  sendDeploymentSuccessAlert,
  sendDeploymentFailedAlert,
  sendRollbackAlert,
  sendHealthCheckFailedAlert,
} from "./notification-service";
import { generateDailyReport, formatReportEmail } from "./report-generator";

describe("AEC Alert System", () => {
  let testErrorId: number;
  let testDiagnosticId: number;
  let testPatchId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test error
    const [error] = await db.insert(aecDetectedErrors).values({
      errorType: "TEST_ERROR",
      severity: "critical",
      message: "Test error for alert system",
      source: "test-file.ts",
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      occurrenceCount: 1,
      status: "detected",
    });
    testErrorId = error.insertId;

    // Create test diagnostic
    const [diagnostic] = await db.insert(aecDiagnostics).values({
      errorId: testErrorId,
      rootCause: JSON.stringify({ issue: "Test root cause" }),
      impact: "high",
      affectedFeatures: JSON.stringify(["medical-triage", "diagnosis"]),
      proposedSolution: "Test solution",
      confidence: 95.5,
    });
    testDiagnosticId = diagnostic.insertId;

    // Create test patch
    const [patch] = await db.insert(aecPatches).values({
      errorId: testErrorId,
      patchVersion: "v1.0.0-test-001",
      branchName: "aec/test-patch",
      filesModified: JSON.stringify(["test-file.ts"]),
      status: "generated",
    });
    testPatchId = patch.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(aecPatches).where(eq(aecPatches.id, testPatchId));
    await db.delete(aecDiagnostics).where(eq(aecDiagnostics.id, testDiagnosticId));
    await db.delete(aecDetectedErrors).where(eq(aecDetectedErrors.id, testErrorId));
  });

  describe("Notification Service", () => {
    it("should send critical error alert", async () => {
      const result = await sendCriticalErrorAlert(testErrorId);
      expect(result.success).toBe(true);
    });

    it("should send manual review alert for high-impact patches", async () => {
      const result = await sendManualReviewAlert(testPatchId);
      expect(result.success).toBe(true);
    });

    it("should send patch generated alert", async () => {
      const result = await sendPatchGeneratedAlert(testPatchId);
      expect(result.success).toBe(true);
    });

    it("should send deployment success alert", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update patch to deployed status
      await db
        .update(aecPatches)
        .set({ status: "deployed", deployedAt: new Date() })
        .where(eq(aecPatches.id, testPatchId));

      const result = await sendDeploymentSuccessAlert(testPatchId);
      expect(result.success).toBe(true);
    });

    it("should send deployment failed alert", async () => {
      const result = await sendDeploymentFailedAlert(testPatchId, "Test deployment failure");
      expect(result.success).toBe(true);
    });

    it("should send rollback alert", async () => {
      const result = await sendRollbackAlert(testPatchId, "Test rollback reason");
      expect(result.success).toBe(true);
    });

    it("should send health check failed alert", async () => {
      const checks = {
        api: false,
        database: true,
        criticalEndpoints: false,
      };
      const result = await sendHealthCheckFailedAlert(checks);
      expect(result.success).toBe(true);
    });

    it("should handle missing error gracefully", async () => {
      const result = await sendCriticalErrorAlert(999999);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle missing patch gracefully", async () => {
      const result = await sendPatchGeneratedAlert(999999);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Report Generation", () => {
    it("should generate morning report", async () => {
      const report = await generateDailyReport("morning");
      expect(report).toBeDefined();
      expect(report?.period).toBe("morning");
      expect(report?.timeRange).toBeDefined();
      expect(report?.summary).toBeDefined();
    });

    it("should generate evening report", async () => {
      const report = await generateDailyReport("evening");
      expect(report).toBeDefined();
      expect(report?.period).toBe("evening");
      expect(report?.timeRange).toBeDefined();
      expect(report?.summary).toBeDefined();
    });

    it("should include test error in report", async () => {
      const report = await generateDailyReport("morning");
      expect(report).toBeDefined();
      expect(report?.errors).toBeDefined();
      
      // Check if our test error is included (it should be if created recently)
      const hasTestError = report?.errors.some(e => e.id === testErrorId);
      expect(hasTestError).toBe(true);
    });

    it("should format report email correctly", async () => {
      const report = await generateDailyReport("morning");
      if (!report) throw new Error("Report generation failed");

      const emailContent = formatReportEmail(report);
      expect(emailContent).toContain("AEC Daily Report");
      expect(emailContent).toContain("EXECUTIVE SUMMARY");
      expect(emailContent).toContain("SYSTEM HEALTH");
      expect(emailContent).toContain("Total Errors Detected");
    });

    it("should include summary statistics in report", async () => {
      const report = await generateDailyReport("morning");
      expect(report).toBeDefined();
      expect(report?.summary.totalErrors).toBeGreaterThanOrEqual(0);
      expect(report?.summary.criticalErrors).toBeGreaterThanOrEqual(0);
      expect(report?.summary.patchesGenerated).toBeGreaterThanOrEqual(0);
    });

    it("should include health status in report", async () => {
      const report = await generateDailyReport("morning");
      expect(report).toBeDefined();
      expect(report?.healthStatus).toBeDefined();
      expect(report?.healthStatus.lastCheckTime).toBeInstanceOf(Date);
    });
  });

  describe("Alert Integration", () => {
    it("should track error occurrence count", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [error] = await db
        .select()
        .from(aecDetectedErrors)
        .where(eq(aecDetectedErrors.id, testErrorId))
        .limit(1);

      expect(error).toBeDefined();
      expect(error.occurrenceCount).toBeGreaterThanOrEqual(1);
    });

    it("should link diagnostic to error", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [diagnostic] = await db
        .select()
        .from(aecDiagnostics)
        .where(eq(aecDiagnostics.errorId, testErrorId))
        .limit(1);

      expect(diagnostic).toBeDefined();
      expect(diagnostic.errorId).toBe(testErrorId);
    });

    it("should link patch to error", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [patch] = await db
        .select()
        .from(aecPatches)
        .where(eq(aecPatches.errorId, testErrorId))
        .limit(1);

      expect(patch).toBeDefined();
      expect(patch.errorId).toBe(testErrorId);
    });

    it("should detect medical pathway features for manual review", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [diagnostic] = await db
        .select()
        .from(aecDiagnostics)
        .where(eq(aecDiagnostics.errorId, testErrorId))
        .limit(1);

      const affectedFeatures = JSON.parse(diagnostic.affectedFeatures || "[]");
      const hasMedicalFeature = affectedFeatures.some((f: string) =>
        f.toLowerCase().includes("medical") ||
        f.toLowerCase().includes("triage") ||
        f.toLowerCase().includes("diagnosis")
      );

      expect(hasMedicalFeature).toBe(true);
    });
  });

  describe("Database Schema", () => {
    it("should have aec_detected_errors table", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const errors = await db.select().from(aecDetectedErrors).limit(1);
      expect(errors).toBeDefined();
    });

    it("should have aec_diagnostics table", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const diagnostics = await db.select().from(aecDiagnostics).limit(1);
      expect(diagnostics).toBeDefined();
    });

    it("should have aec_patches table", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const patches = await db.select().from(aecPatches).limit(1);
      expect(patches).toBeDefined();
    });

    it("should have aec_health_checks table", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const healthChecks = await db.select().from(aecHealthChecks).limit(1);
      expect(healthChecks).toBeDefined();
    });
  });
});
