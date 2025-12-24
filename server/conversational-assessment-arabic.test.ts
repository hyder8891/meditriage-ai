import { describe, it, expect, beforeEach, vi } from "vitest";
import { processConversationalAssessment, startConversation } from "./conversational-assessment-integrated";

// Mock the LLM and BRAIN modules
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            extracted: {
              symptoms: ["صداع", "حمى"],
              duration: "يومين",
              severity: "شديد",
              location: "الرأس"
            },
            nextQuestion: "هل تعاني من أي أعراض أخرى؟"
          })
        }
      }
    ]
  })
}));

vi.mock("./brain/index", () => ({
  BRAIN: vi.fn().mockImplementation(() => ({
    reason: vi.fn().mockResolvedValue({
      caseId: "test-case-123",
      diagnosis: {
        differentialDiagnosis: [
          {
            condition: "Tension-Type Headache (TTH)",
            probability: 0.5,
            reasoning: "The description 'صداع ضاغط' (pressure headache) is highly characteristic of TTH."
          },
          {
            condition: "Migraine without Aura",
            probability: 0.2,
            reasoning: "Migraine is highly prevalent and can present as pressure headache."
          }
        ],
        redFlags: [
          "Worst headache of life (Thunderclap headache – immediate emergency referral)",
          "Fever, stiff neck, or altered mental status"
        ],
        recommendations: {
          immediateActions: [
            "Obtain complete vital signs immediately, especially Blood Pressure (BP) and Temperature",
            "Detailed history taking (onset, duration, frequency, severity)"
          ],
          tests: [
            "Basic Metabolic Panel (BMP) if HTN is suspected",
            "Complete Blood Count (CBC) if infectious etiology suspected"
          ],
          referrals: [
            "If BP is severely elevated, immediate referral to Emergency Department",
            "If headache is chronic, referral to Neurology"
          ]
        }
      },
      evidence: [
        {
          title: "Tension-Type Headache Guidelines",
          source: "PubMed"
        }
      ]
    })
  }))
}));

vi.mock("./brain/orchestrator", () => ({
  executeAvicennaLoop: vi.fn().mockResolvedValue(null)
}));

describe("Conversational Assessment - Arabic Translations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start conversation with Arabic greeting when language is 'ar'", async () => {
    const result = await startConversation("ar");
    
    expect(result.messageAr).toBe("مرحباً. أنا AI Doctor، مساعدك الطبي الذكي. من فضلك أخبرني، ما هي الأعراض التي تعاني منها اليوم؟");
    expect(result.conversationStage).toBe("greeting");
  });

  it("should generate Arabic comprehensive assessment at final step", async () => {
    const context = {
      symptoms: ["صداع", "حمى"],
      duration: "يومين",
      severity: "8",
      location: "الرأس",
      stepCount: 7
    };

    const result = await processConversationalAssessment(
      "نعم، أشعر بصداع شديد",
      context,
      [],
      "ar",
      1,
      { age: 30, gender: "male" as const }
    );

    // Check that Arabic message is returned
    expect(result.messageAr).toBeDefined();
    expect(result.conversationStage).toBe("complete");
    
    // Verify Arabic section headers are present
    expect(result.messageAr).toContain("التقييم الطبي الشامل");
    expect(result.messageAr).toContain("التشخيص الأساسي");
    expect(result.messageAr).toContain("الحالات المحتملة الأخرى");
    expect(result.messageAr).toContain("علامات تحذيرية");
    expect(result.messageAr).toContain("الإجراءات الفورية");
    expect(result.messageAr).toContain("الفحوصات الموصى بها");
    expect(result.messageAr).toContain("التحويلات للمتخصصين");
    expect(result.messageAr).toContain("الأدلة الداعمة");
    
    // Verify disclaimer is in Arabic
    expect(result.messageAr).toContain("هذا التقييم تم إنشاؤه بواسطة AI Doctor");
    expect(result.messageAr).toContain("وهو ليس بديلاً عن الاستشارة الطبية المتخصصة");
  });

  it("should use Arabic message when language is 'ar'", async () => {
    const context = {
      symptoms: ["صداع"],
      stepCount: 7
    };

    const result = await processConversationalAssessment(
      "صداع شديد",
      context,
      [],
      "ar",
      1,
      { age: 30, gender: "male" as const }
    );

    // When language is 'ar', message should be the Arabic version
    expect(result.message).toBe(result.messageAr);
    expect(result.message).toContain("التقييم الطبي الشامل");
  });

  it("should use English message when language is 'en'", async () => {
    const context = {
      symptoms: ["headache"],
      stepCount: 7
    };

    const result = await processConversationalAssessment(
      "severe headache",
      context,
      [],
      "en",
      1,
      { age: 30, gender: "male" as const }
    );

    // When language is 'en', message should be the English version
    expect(result.message).toContain("Comprehensive Medical Assessment");
    expect(result.message).not.toContain("التقييم الطبي الشامل");
  });

  it("should include medical terms in both English and Arabic versions", async () => {
    const context = {
      symptoms: ["صداع"],
      stepCount: 7
    };

    const result = await processConversationalAssessment(
      "صداع",
      context,
      [],
      "ar",
      1,
      { age: 30, gender: "male" as const }
    );

    // Medical terms should remain in English
    expect(result.messageAr).toContain("Tension-Type Headache (TTH)");
    expect(result.messageAr).toContain("Blood Pressure (BP)");
    expect(result.messageAr).toContain("Complete Blood Count (CBC)");
  });

  it("should have both English and Arabic versions available", async () => {
    const context = {
      symptoms: ["صداع"],
      stepCount: 7
    };

    const result = await processConversationalAssessment(
      "صداع",
      context,
      [],
      "ar",
      1,
      { age: 30, gender: "male" as const }
    );

    // Both versions should be available
    expect(result.message).toBeDefined();
    expect(result.messageAr).toBeDefined();
    
    // messageAr should contain Arabic headers
    expect(result.messageAr).toContain("التقييم الطبي الشامل");
    
    // message should be the Arabic version when language is 'ar'
    expect(result.message).toBe(result.messageAr);
  });
});
