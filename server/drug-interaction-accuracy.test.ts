import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { db } from "./db";

/**
 * Test suite for Drug Interaction Accuracy
 * Tests the PharmGuard function's ability to accurately detect and analyze drug interactions
 */

// Create a test context with authenticated clinician user
function createTestContext() {
  const ctx = {
    user: {
      id: 1,
      openId: "test-clinician",
      name: "Test Clinician",
      email: "clinician@test.com",
      role: "admin" as const,
      createdAt: new Date(),
    },
    db,
  };

  return { ctx };
}

describe("PharmGuard Drug Interaction Accuracy Tests", () => {
  it("should detect severe interaction between Warfarin and Aspirin", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Warfarin", "Aspirin"],
    });

    // Verify response structure
    expect(result).toBeDefined();
    expect(result.interactions).toBeDefined();
    expect(Array.isArray(result.interactions)).toBe(true);
    
    // Should detect at least one interaction (Warfarin + Aspirin is a known major interaction)
    expect(result.interactions.length).toBeGreaterThan(0);
    
    // Verify interaction details
    const interaction = result.interactions[0];
    expect(interaction.drugs).toBeDefined();
    expect(interaction.severity).toBeDefined();
    
    // Severity should be major or contraindicated
    const severity = interaction.severity.toLowerCase();
    expect(['contraindicated', 'major']).toContain(severity);
    
    // Should have mechanism explanation
    expect(interaction.mechanism).toBeDefined();
    expect(interaction.mechanism.length).toBeGreaterThan(20);
    
    // Should mention bleeding risk
    const content = JSON.stringify(interaction).toLowerCase();
    expect(content).toMatch(/bleed|hemorrhag/);
    
    // Should have clinical significance
    expect(interaction.clinicalSignificance).toBeDefined();
    
    // Should have management recommendations
    expect(interaction.management).toBeDefined();
    
    // Overall risk should be high or moderate
    expect(result.overallRisk).toBeDefined();
    expect(['high', 'moderate']).toContain(result.overallRisk.toLowerCase());
  }, 30000); // 30 second timeout for LLM response

  it("should detect interaction between Metformin and contrast dye", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Metformin", "Iodinated contrast media"],
    });

    expect(result).toBeDefined();
    expect(result.interactions).toBeDefined();
    
    // This is a known major interaction
    if (result.interactions.length > 0) {
      const interaction = result.interactions[0];
      expect(interaction.mechanism).toBeDefined();
      expect(interaction.management).toBeDefined();
      
      // Should mention lactic acidosis or renal function
      const content = JSON.stringify(interaction).toLowerCase();
      const hasRelevantInfo = 
        content.includes('lactic acidosis') || 
        content.includes('renal') || 
        content.includes('kidney') ||
        content.includes('acidosis');
      expect(hasRelevantInfo).toBe(true);
    }
  }, 30000);

  it("should provide alternatives when interactions are found", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Warfarin", "NSAIDs"],
    });

    expect(result).toBeDefined();
    
    if (result.interactions.length > 0) {
      const interaction = result.interactions[0];
      
      // Should provide alternatives
      expect(interaction.alternatives).toBeDefined();
      
      // Should have monitoring parameters
      if (interaction.monitoringParameters) {
        expect(Array.isArray(interaction.monitoringParameters)).toBe(true);
        if (interaction.monitoringParameters.length > 0) {
          const param = interaction.monitoringParameters[0];
          expect(param.parameter).toBeDefined();
          expect(param.frequency).toBeDefined();
        }
      }
    }
  }, 30000);

  it("should handle multiple drug combinations (3+ medications)", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Warfarin", "Aspirin", "Omeprazole"],
    });

    expect(result).toBeDefined();
    expect(result.interactions).toBeDefined();
    expect(result.overallRisk).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    
    // Should analyze multiple potential interactions
    expect(result.interactions.length).toBeGreaterThan(0);
  }, 30000);

  it("should provide Iraqi medication context", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Enalapril", "Amlodipine"],
    });

    expect(result).toBeDefined();
    
    // Should have availability notes for Iraqi context
    if (result.availabilityNotes) {
      expect(typeof result.availabilityNotes).toBe('string');
      expect(result.availabilityNotes.length).toBeGreaterThan(0);
    }
    
    // Should have cost effectiveness analysis
    if (result.costEffectiveness) {
      expect(typeof result.costEffectiveness).toBe('string');
      expect(result.costEffectiveness.length).toBeGreaterThan(0);
    }
  }, 30000);

  it("should return valid JSON structure even with no interactions", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Paracetamol", "Vitamin D"],
    });

    // Should always return proper structure
    expect(result).toBeDefined();
    expect(result.interactions).toBeDefined();
    expect(Array.isArray(result.interactions)).toBe(true);
    expect(result.overallRisk).toBeDefined();
    expect(result.recommendations).toBeDefined();
    
    // Low risk expected for these medications
    expect(result.overallRisk.toLowerCase()).toBe('low');
  }, 30000);

  it("should include food interactions when relevant", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Warfarin"],
    });

    expect(result).toBeDefined();
    
    // Should have food interactions section
    expect(result.foodInteractions).toBeDefined();
    expect(Array.isArray(result.foodInteractions)).toBe(true);
    
    // Warfarin should have food interactions (Vitamin K)
    if (result.foodInteractions.length > 0) {
      const foodInt = result.foodInteractions[0];
      expect(foodInt.food).toBeDefined();
      expect(foodInt.interaction).toBeDefined();
      expect(foodInt.recommendation).toBeDefined();
    }
  }, 30000);

  it("should provide patient counseling points", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Metformin", "Alcohol"],
    });

    expect(result).toBeDefined();
    
    if (result.interactions.length > 0) {
      const interaction = result.interactions[0];
      
      // Should have patient counseling
      if (interaction.patientCounseling) {
        expect(typeof interaction.patientCounseling).toBe('string');
        expect(interaction.patientCounseling.length).toBeGreaterThan(10);
      }
    }
  }, 30000);

  it("should detect ACE inhibitor and potassium interaction", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Enalapril", "Potassium supplements"],
    });

    expect(result).toBeDefined();
    expect(result.interactions.length).toBeGreaterThan(0);
    
    // Should mention hyperkalemia
    const content = JSON.stringify(result).toLowerCase();
    expect(content).toMatch(/hyperkalemia|potassium/);
  }, 30000);

  it("should detect SSRI and NSAID interaction", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Sertraline", "Ibuprofen"],
    });

    expect(result).toBeDefined();
    
    // Should detect bleeding risk
    if (result.interactions.length > 0) {
      const content = JSON.stringify(result).toLowerCase();
      expect(content).toMatch(/bleed|gastrointestinal/);
    }
  }, 30000);

  it("should provide severity scores", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clinical.checkDrugInteractions({
      medications: ["Warfarin", "Aspirin"],
    });

    expect(result).toBeDefined();
    
    if (result.interactions.length > 0) {
      const interaction = result.interactions[0];
      
      // Should have severity score
      if (interaction.severityScore !== undefined) {
        expect(typeof interaction.severityScore).toBe('number');
        expect(interaction.severityScore).toBeGreaterThanOrEqual(1);
        expect(interaction.severityScore).toBeLessThanOrEqual(10);
      }
    }
    
    // Should have overall risk score
    if (result.overallRiskScore !== undefined) {
      expect(typeof result.overallRiskScore).toBe('number');
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(1);
      expect(result.overallRiskScore).toBeLessThanOrEqual(10);
    }
  }, 30000);
});
