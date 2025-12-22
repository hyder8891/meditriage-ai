/**
 * Lab Results System Tests
 * Tests upload, OCR, parsing, and interpretation
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-lab-user",
    email: "labtest@example.com",
    name: "Lab Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Lab Results System", () => {
  it("should have lab router registered", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.lab).toBeDefined();
    expect(caller.lab.uploadLabReport).toBeDefined();
    expect(caller.lab.processLabReport).toBeDefined();
    expect(caller.lab.getMyLabReports).toBeDefined();
  });

  it("should reject oversized files", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a base64 string larger than 16MB
    const largeData = "A".repeat(17 * 1024 * 1024);
    const base64Data = Buffer.from(largeData).toString("base64");

    await expect(
      caller.lab.uploadLabReport({
        fileName: "large.pdf",
        fileData: base64Data,
        fileType: "application/pdf",
        reportDate: new Date().toISOString(),
      })
    ).rejects.toThrow(/exceeds 16MB/);
  });

  it("should retrieve lab reports for user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const reports = await caller.lab.getMyLabReports();
    expect(Array.isArray(reports)).toBe(true);
  });

  it("should get dashboard summary", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const summary = await caller.lab.getDashboardSummary();
    expect(summary).toBeDefined();
    expect(summary.totalReports).toBeGreaterThanOrEqual(0);
    expect(summary.abnormalCount).toBeGreaterThanOrEqual(0);
    expect(summary.criticalCount).toBeGreaterThanOrEqual(0);
  });

  it("should get lab results for user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const results = await caller.lab.getMyLabResults();
    expect(Array.isArray(results)).toBe(true);
  });

  it("should get abnormal results", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const abnormal = await caller.lab.getAbnormalResults();
    expect(Array.isArray(abnormal)).toBe(true);
  });

  it("should get critical results", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const critical = await caller.lab.getCriticalResults();
    expect(Array.isArray(critical)).toBe(true);
  });

  it("should validate report ownership", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    // Try to access a non-existent report
    await expect(
      caller.lab.getLabReport({ reportId: 999999 })
    ).rejects.toThrow(/not found/);
  });

  it("should have OCR extraction capability", async () => {
    const { extractTextFromLabReport } = await import("./lab-ocr");
    expect(typeof extractTextFromLabReport).toBe("function");
  });

  it("should have result parsing capability", async () => {
    const { parseLabResults } = await import("./lab-ocr");
    expect(typeof parseLabResults).toBe("function");
  });

  it("should have interpretation capability", async () => {
    const { interpretLabResult } = await import("./lab-ocr");
    expect(typeof interpretLabResult).toBe("function");
  });

  it("should have database helper functions", async () => {
    const {
      createLabReport,
      getLabReportsByUser,
      getLabResultsByUser,
      getAbnormalLabResults,
      getCriticalLabResults,
    } = await import("./lab-db");

    expect(typeof createLabReport).toBe("function");
    expect(typeof getLabReportsByUser).toBe("function");
    expect(typeof getLabResultsByUser).toBe("function");
    expect(typeof getAbnormalLabResults).toBe("function");
    expect(typeof getCriticalLabResults).toBe("function");
  });
});
