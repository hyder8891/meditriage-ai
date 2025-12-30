import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPatientContext(): TrpcContext {
  const user: AuthenticatedUser = {
      id: 1,
      name: "Test Patient",
      email: "patient@test.com",
      role: "patient" as const,
      openId: "test-patient-123",
      phoneNumber: null,
      phoneVerified: false,
      countryCode: "+964",
      clinicId: null,
      licenseNumber: null,
      specialty: null,
      verified: false,
      availabilityStatus: null,
      currentPatientCount: 0,
      maxPatientsPerDay: 50,
      lastStatusChange: null,
      autoOfflineMinutes: 15,
      dateOfBirth: null,
      gender: null,
      bloodType: null,
      height: null,
      weight: null,
      chronicConditions: null,
      allergies: null,
      currentMedications: null,
      medicalHistory: null,
      emergencyContact: null,
      emergencyContactName: null,
      emailVerified: false,
      verificationToken: null,
      verificationTokenExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
      tokenVersion: 0,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingSkipped: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "oauth",
      passwordHash: null,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Bio-Scanner Vitals System", () => {
  const ctx = createPatientContext();
  const caller = appRouter.createCaller(ctx);

  it("should log vital signs successfully", async () => {
    const result = await caller.vitals.logVital({
      heartRate: 75,
      confidence: 95,
      stress: "NORMAL",
      measurementDuration: 15,
      hrvRmssd: 45.2,
      hrvSdnn: 52.8,
      hrvPnn50: 25.5,
      hrvLfHfRatio: 1.2,
      hrvStressScore: 35,
      hrvAnsBalance: "BALANCED",
      deviceInfo: {
        browser: "Chrome",
        cameraResolution: "1920x1080",
        userAgent: "Mozilla/5.0...",
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

  it("should retrieve recent vitals", async () => {
    const vitals = await caller.vitals.getRecent({ limit: 5 });
    
    expect(Array.isArray(vitals)).toBe(true);
    // If vitals exist, check structure
    if (vitals.length > 0) {
      expect(vitals[0]).toHaveProperty("heartRate");
      expect(vitals[0]).toHaveProperty("confidenceScore");
      expect(vitals[0]).toHaveProperty("createdAt");
    }
  });

  it("should get vitals statistics", async () => {
    const stats = await caller.vitals.getStats();
    
    expect(stats).toHaveProperty("totalReadings");
    expect(stats).toHaveProperty("avgHeartRate");
    expect(stats).toHaveProperty("avgStress");
    expect(typeof stats.totalReadings).toBe("number");
  });

  it("should save calibration data", async () => {
    const result = await caller.vitals.saveCalibration({
      referenceHeartRate: 72,
      measuredHeartRate: 75,
      referenceDevice: "Apple Watch Series 8",
      notes: "Calibration test",
    });

    expect(result.success).toBe(true);
    expect(result.correctionFactor).toBeCloseTo(0.96, 2);
  });

  it("should retrieve calibration data", async () => {
    const calibration = await caller.vitals.getCalibration();
    
    // Calibration might be null if not set
    if (calibration) {
      expect(calibration).toHaveProperty("referenceHeartRate");
      expect(calibration).toHaveProperty("measuredHeartRate");
      expect(calibration).toHaveProperty("correctionFactor");
    }
  });

  it("should validate heart rate bounds", async () => {
    await expect(
      caller.vitals.logVital({
        heartRate: 300, // Invalid: too high
        confidence: 95,
        stress: "NORMAL",
      })
    ).rejects.toThrow();

    await expect(
      caller.vitals.logVital({
        heartRate: 20, // Invalid: too low
        confidence: 95,
        stress: "NORMAL",
      })
    ).rejects.toThrow();
  });

  it("should get trends for different time ranges", async () => {
    const trends24h = await caller.vitals.getTrends({
      timeRange: "24h",
      metric: "heartRate",
    });

    expect(Array.isArray(trends24h)).toBe(true);
    
    const trends7d = await caller.vitals.getTrends({
      timeRange: "7d",
      metric: "stress",
    });

    expect(Array.isArray(trends7d)).toBe(true);
  });
});
