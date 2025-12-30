import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Vitals Router - Bio Scanner", () => {
  let testUserId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get or create a test user
    const existingUsers = await db.select().from(users).where(eq(users.email, "test-patient@example.com")).limit(1);
    
    if (existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
    } else {
      await db.insert(users).values({
        email: "test-patient@example.com",
        name: "Test Patient",
        role: "patient",
        openId: "test-patient-openid",
      });
      
      // Fetch the newly created user
      const newUsers = await db.select().from(users).where(eq(users.email, "test-patient@example.com")).limit(1);
      testUserId = newUsers[0].id;
    }

    // Create caller with authenticated context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: "test-patient@example.com",
        name: "Test Patient",
        role: "patient",
        openId: "test-patient-openid",
      },
    });
  });

  it("should log vital signs from bio scanner", async () => {
    const result = await caller.vitals.logVital({
      heartRate: 75,
      confidence: 85,
      stress: "NORMAL",
      measurementDuration: 15,
      hrvRmssd: 42.5,
      hrvSdnn: 50.2,
      hrvPnn50: 15.8,
      hrvLfHfRatio: 1.2,
      hrvStressScore: 35,
      hrvAnsBalance: "BALANCED",
      deviceInfo: {
        browser: "Chrome",
        cameraResolution: "1920x1080",
        userAgent: "Mozilla/5.0",
      },
      environmentalFactors: {
        lightingQuality: "good",
        movementDetected: false,
        faceDetectionConfidence: 0.95,
      },
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Vital signs recorded successfully");
  });

  it("should retrieve recent vital signs", async () => {
    const vitals = await caller.vitals.getRecent({ limit: 5 });
    
    expect(Array.isArray(vitals)).toBe(true);
    expect(vitals.length).toBeGreaterThan(0);
    
    const latestVital = vitals[0];
    expect(latestVital).toHaveProperty("heartRate");
    expect(latestVital).toHaveProperty("confidenceScore");
    expect(latestVital).toHaveProperty("stressLevel");
  });

  it("should get vital signs statistics", async () => {
    const stats = await caller.vitals.getStats();
    
    expect(stats).toHaveProperty("totalReadings");
    expect(stats).toHaveProperty("avgHeartRate");
    expect(stats).toHaveProperty("avgStress");
    expect(stats.totalReadings).toBeGreaterThan(0);
  });

  it("should validate heart rate range", async () => {
    await expect(
      caller.vitals.logVital({
        heartRate: 300, // Invalid - too high
        confidence: 85,
        stress: "NORMAL",
      })
    ).rejects.toThrow();

    await expect(
      caller.vitals.logVital({
        heartRate: 20, // Invalid - too low
        confidence: 85,
        stress: "NORMAL",
      })
    ).rejects.toThrow();
  });

  it("should save and retrieve calibration data", async () => {
    const saveResult = await caller.vitals.saveCalibration({
      referenceHeartRate: 72,
      measuredHeartRate: 75,
      referenceDevice: "Pulse Oximeter",
      notes: "Test calibration",
    });

    expect(saveResult.success).toBe(true);
    expect(saveResult.correctionFactor).toBeCloseTo(0.96, 2);

    const calibration = await caller.vitals.getCalibration();
    expect(calibration).not.toBeNull();
    expect(calibration?.referenceHeartRate).toBe(72);
    expect(calibration?.measuredHeartRate).toBe(75);
  });

  it("should get trends data", async () => {
    const trends = await caller.vitals.getTrends({
      timeRange: "7d",
      metric: "heartRate",
    });

    expect(Array.isArray(trends)).toBe(true);
    if (trends.length > 0) {
      expect(trends[0]).toHaveProperty("timestamp");
      expect(trends[0]).toHaveProperty("value");
      expect(trends[0]).toHaveProperty("confidence");
    }
  });
});
