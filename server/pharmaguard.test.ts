import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";
import { users, patientMedications, medicalConditions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("PharmaGuard Router Tests", () => {
  let testUserId: number;
  let testMedicationId: number;
  let testConditionId: number;

  // Create a test user before running tests
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const result = await db.insert(users).values({
      openId: `test-pharmaguard-${Date.now()}`,
      name: "Test Pharmaguard User",
      email: `test-pharmaguard-${Date.now()}@test.com`,
      role: "patient",
    });
    testUserId = result[0].insertId;
  });

  // Clean up test data after all tests
  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test medications
    if (testMedicationId) {
      await db.delete(patientMedications).where(eq(patientMedications.id, testMedicationId));
    }

    // Clean up test conditions
    if (testConditionId) {
      await db.delete(medicalConditions).where(eq(medicalConditions.id, testConditionId));
    }

    // Clean up test user
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("Medication Management", () => {
    it("should add a medication for the current user", async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      const result = await caller.pharmaguard.addMedication({
        drugName: "Metformin",
        genericName: "Metformin",
        brandName: "Glucophage",
        dosage: "500mg",
        frequency: "twice daily",
        route: "oral",
        purpose: "Type 2 diabetes management",
        source: "prescription",
      });

      expect(result.success).toBe(true);
      expect(result.medicationId).toBeDefined();
      testMedicationId = result.medicationId;
    });

    it("should retrieve medications for the current user", async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      const medications = await caller.pharmaguard.getMyMedications({
        activeOnly: true,
      });

      expect(Array.isArray(medications)).toBe(true);
      expect(medications.length).toBeGreaterThan(0);
      
      const metformin = medications.find((m: any) => m.drugName === "Metformin");
      expect(metformin).toBeDefined();
      expect(metformin?.dosage).toBe("500mg");
      expect(metformin?.frequency).toBe("twice daily");
    });

    it("should remove a medication", async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      
      // First add a medication to remove
      const addResult = await caller.pharmaguard.addMedication({
        drugName: "Test Medication",
        dosage: "100mg",
        source: "self_reported",
      });

      const medicationId = addResult.medicationId;

      // Now remove it (deactivate, not delete)
      const removeResult = await caller.pharmaguard.removeMedication({
        medicationId,
        deleteCompletely: false,
      });

      expect(removeResult.success).toBe(true);

      // Verify it's no longer in active medications
      const activeMeds = await caller.pharmaguard.getMyMedications({
        activeOnly: true,
      });
      
      const removedMed = activeMeds.find((m: any) => m.id === medicationId);
      expect(removedMed).toBeUndefined();
    });
  });

  describe("Medical Conditions Management", () => {
    it("should add a medical condition", async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      const result = await caller.pharmaguard.addCondition({
        conditionName: "Hypertension",
        conditionType: "chronic_disease",
        severity: "moderate",
        notes: "Diagnosed 2 years ago",
      });

      expect(result.success).toBe(true);
      expect(result.conditionId).toBeDefined();
      testConditionId = result.conditionId;
    });

    it("should retrieve medical conditions", async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      const conditions = await caller.pharmaguard.getMyConditions({
        activeOnly: true,
      });

      expect(Array.isArray(conditions)).toBe(true);
      expect(conditions.length).toBeGreaterThan(0);
      
      const hypertension = conditions.find((c: any) => c.conditionName === "Hypertension");
      expect(hypertension).toBeDefined();
      expect(hypertension?.severity).toBe("moderate");
    });
  });

  describe("Personalized Drug Interaction Checking", () => {
    it("should check personalized interactions considering patient profile", { timeout: 30000 }, async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      
      // This will check "Aspirin" against the patient's current medications (Metformin)
      // and medical conditions (Hypertension)
      const result = await caller.pharmaguard.checkPersonalizedInteractions({
        newMedication: "Aspirin 100mg",
      });

      expect(result).toBeDefined();
      expect(result.safe).toBeDefined();
      expect(result.overallRisk).toBeDefined();
      expect(Array.isArray(result.interactions)).toBe(true);
      
      // The result should include recommendations
      if (result.recommendations) {
        expect(Array.isArray(result.recommendations)).toBe(true);
      }
    });

    it("should log the interaction check in history", { timeout: 30000 }, async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      
      // Perform a check
      await caller.pharmaguard.checkPersonalizedInteractions({
        newMedication: "Warfarin",
      });

      // Retrieve history
      const history = await caller.pharmaguard.getInteractionHistory({
        limit: 10,
      });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      // The most recent check should include Warfarin
      const recentCheck = history[0];
      expect(recentCheck).toBeDefined();
      expect(recentCheck.medicationsChecked).toBeDefined();
      
      const checkedMeds = JSON.parse(recentCheck.medicationsChecked);
      expect(checkedMeds).toContain("Warfarin");
    });
  });

  describe("Authorization Tests", () => {
    it("should prevent unauthorized access to other patient's medications", async () => {
      const ctx: Context = {
        user: {
          id: 99999, // Different user
          openId: "unauthorized-user",
          name: "Unauthorized User",
          email: "unauthorized@test.com",
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.pharmaguard.getMyMedications({
          patientId: testUserId, // Trying to access another patient's data
          activeOnly: true,
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow clinicians to access patient medications", async () => {
      const ctx: Context = {
        user: {
          id: 88888,
          openId: "clinician-user",
          name: "Dr. Clinician",
          email: "clinician@test.com",
          role: "clinician",
        },
      };

      const caller = appRouter.createCaller(ctx);
      
      // Clinicians should be able to access patient data
      const medications = await caller.pharmaguard.getMyMedications({
        patientId: testUserId,
        activeOnly: true,
      });

      expect(Array.isArray(medications)).toBe(true);
    });
  });

  describe("Image Upload", () => {
    it("should accept valid image upload", async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      
      // Create a small test image (1x1 pixel PNG)
      const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      
      const result = await caller.pharmaguard.uploadMedicineImage({
        imageBase64: testImageBase64,
        mimeType: "image/png",
      });

      expect(result.success).toBe(true);
      expect(result.imageId).toBeDefined();
      expect(result.imageUrl).toBeDefined();
      expect(result.imageUrl).toContain("http");
    });

    it("should reject non-image file types", async () => {
      const ctx: Context = {
        user: {
          id: testUserId,
          openId: `test-pharmaguard-${testUserId}`,
          name: "Test User",
          email: `test-${testUserId}@test.com`,
          role: "patient",
        },
      };

      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.pharmaguard.uploadMedicineImage({
          imageBase64: "dGVzdCBkYXRh", // "test data" in base64
          mimeType: "text/plain",
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
        expect(error.message).toContain("Invalid image type");
      }
    });
  });
});
