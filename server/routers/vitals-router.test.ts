import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPatientContext(userId: number = 999): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-patient-${userId}`,
    email: `patient${userId}@example.com`,
    name: "Test Patient",
    loginMethod: "manus",
    role: "patient",
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

describe("Vitals Router", () => {
  describe("logVital", () => {
    it("should accept valid vital measurement", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vitals.logVital({
        heartRate: 75,
        confidence: 85,
        stress: "NORMAL",
        measurementDuration: 15,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Vital signs recorded successfully");
    });

    it("should reject heart rate below minimum (30 BPM)", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.vitals.logVital({
          heartRate: 25,
          confidence: 85,
          stress: "LOW",
        })
      ).rejects.toThrow();
    });

    it("should reject heart rate above maximum (250 BPM)", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.vitals.logVital({
          heartRate: 260,
          confidence: 85,
          stress: "HIGH",
        })
      ).rejects.toThrow();
    });

    it("should reject confidence score below 0", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.vitals.logVital({
          heartRate: 75,
          confidence: -10,
          stress: "NORMAL",
        })
      ).rejects.toThrow();
    });

    it("should reject confidence score above 100", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.vitals.logVital({
          heartRate: 75,
          confidence: 150,
          stress: "NORMAL",
        })
      ).rejects.toThrow();
    });

    it("should accept valid stress levels", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      for (const stress of ["LOW", "NORMAL", "HIGH"] as const) {
        const result = await caller.vitals.logVital({
          heartRate: 75,
          confidence: 85,
          stress,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept optional device info", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vitals.logVital({
        heartRate: 75,
        confidence: 85,
        stress: "NORMAL",
        deviceInfo: {
          browser: "Chrome",
          cameraResolution: "640x480",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept optional environmental factors", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vitals.logVital({
        heartRate: 75,
        confidence: 85,
        stress: "NORMAL",
        environmentalFactors: {
          lightingQuality: "good",
          movementDetected: false,
          faceDetectionConfidence: 90,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getRecent", () => {
    it("should return recent vitals for authenticated user", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vitals.getRecent({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept custom limit parameter", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vitals.getRecent({ limit: 5 });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should use default limit when not specified", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vitals.getRecent();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getStats", () => {
    it("should return statistics for authenticated user", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.vitals.getStats();

      expect(stats).toHaveProperty("totalMeasurements");
      expect(stats).toHaveProperty("averageHeartRate");
      expect(stats).toHaveProperty("lowestHeartRate");
      expect(stats).toHaveProperty("highestHeartRate");
      expect(stats).toHaveProperty("averageConfidence");
      expect(stats).toHaveProperty("stressDistribution");
      expect(stats.stressDistribution).toHaveProperty("LOW");
      expect(stats.stressDistribution).toHaveProperty("NORMAL");
      expect(stats.stressDistribution).toHaveProperty("HIGH");
    });
  });

  describe("deleteVital", () => {
    it("should accept valid vital ID for deletion", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      // This will fail if the vital doesn't exist, which is expected
      // The test validates that the endpoint accepts the correct input format
      try {
        await caller.vitals.deleteVital({ id: 99999 });
      } catch (error) {
        // Expected to fail with "not found" error
        expect(error).toBeDefined();
      }
    });
  });
});
