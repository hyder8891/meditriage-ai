import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";

// Mock the storage module
vi.mock("../storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ 
    key: "test-key", 
    url: "https://example.com/test-image.jpg" 
  }),
  storageGet: vi.fn().mockResolvedValue({ 
    key: "test-key", 
    url: "https://example.com/presigned-url.jpg" 
  }),
}));

// Mock the Gemini module
vi.mock("../_core/gemini", () => ({
  invokeGemini: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "gemini-2.5-pro",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: JSON.stringify({
          description: "Test skin rash analysis",
          descriptionAr: "تحليل طفح جلدي اختباري",
          findings: ["Red patches", "Inflammation"],
          findingsAr: ["بقع حمراء", "التهاب"],
          severity: "mild",
          possibleConditions: [{
            name: "Eczema",
            nameAr: "الأكزيما",
            probability: 75,
            reasoning: "Based on appearance",
            reasoningAr: "بناءً على المظهر"
          }],
          recommendations: ["Apply moisturizer", "Avoid irritants"],
          recommendationsAr: ["استخدم مرطب", "تجنب المهيجات"],
          warningSignsToWatch: ["Spreading rash", "Fever"],
          warningSignsToWatchAr: ["انتشار الطفح", "الحمى"],
          seekCareTimeframe: "within_week",
          confidence: 85,
          chainOfThought: [{
            id: "step-1",
            type: "observation",
            title: "Visual Observation",
            titleAr: "الملاحظة المرئية",
            description: "Red patches observed",
            descriptionAr: "لوحظت بقع حمراء",
            confidence: 90
          }]
        })
      },
      finish_reason: "stop"
    }],
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
  }),
}));

// Create test context
function createPatientContext() {
  return {
    user: { 
      id: 1, 
      email: "test@test.com", 
      role: "patient" as const,
      name: "Test Patient"
    },
  };
}

describe("Medical Image Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    caller = appRouter.createCaller(createPatientContext());
  });

  describe("analyzeImage", () => {
    it("should analyze an image and return structured analysis", async () => {
      const testBase64 = Buffer.from("test image data").toString("base64");
      
      const result = await caller.medicalImage.analyzeImage({
        imageBase64: testBase64,
        mimeType: "image/jpeg",
        bodyPart: "arm_left",
        description: "Red rash appeared yesterday",
        language: "en",
      });

      expect(result).toBeDefined();
      expect(result.description).toBe("Test skin rash analysis");
      expect(result.severity).toBe("mild");
      expect(result.possibleConditions).toHaveLength(1);
      expect(result.possibleConditions[0].name).toBe("Eczema");
      expect(result.confidence).toBe(85);
    });

    it("should support Arabic language", async () => {
      const testBase64 = Buffer.from("test image data").toString("base64");
      
      const result = await caller.medicalImage.analyzeImage({
        imageBase64: testBase64,
        mimeType: "image/jpeg",
        language: "ar",
      });

      expect(result).toBeDefined();
      expect(result.descriptionAr).toBe("تحليل طفح جلدي اختباري");
      expect(result.findingsAr).toContain("بقع حمراء");
    });
  });

  describe("uploadAndAnalyze", () => {
    it("should upload and analyze an image in one step", async () => {
      const testBase64 = Buffer.from("test image data").toString("base64");
      
      const result = await caller.medicalImage.uploadAndAnalyze({
        imageBase64: testBase64,
        mimeType: "image/jpeg",
        bodyPart: "skin_general",
        language: "en",
      });

      expect(result).toBeDefined();
      expect(result.upload).toBeDefined();
      expect(result.upload.success).toBe(true);
      expect(result.upload.url).toBe("https://example.com/test-image.jpg");
      expect(result.analysis).toBeDefined();
      expect(result.analysis.description).toBe("Test skin rash analysis");
    });
  });

  describe("getImageUrl", () => {
    it("should return a presigned URL for an image", async () => {
      const result = await caller.medicalImage.getImageUrl({
        key: "test-key",
      });

      expect(result).toBeDefined();
      expect(result.url).toBe("https://example.com/presigned-url.jpg");
    });
  });
});
