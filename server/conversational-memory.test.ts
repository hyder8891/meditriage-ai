/**
 * Conversational Memory Persistence Tests
 * 
 * Tests to verify that conversation context (memory) is properly preserved
 * across multiple messages, including stepCount, symptoms, and other fields.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processConversationalAssessment } from './conversational-assessment';
import { ConversationalContextVector } from './conversational-context-vector';
import * as llm from './_core/llm';

// Mock the LLM module
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn()
}));

describe('Conversational Memory Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step Count Increment', () => {
    it('should increment stepCount on successful AI response', async () => {
      // Mock successful AI response
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "How long have you had this headache?",
              nextQuestionAr: "منذ متى وأنت تعاني من هذا الصداع؟",
              extractedData: {
                symptoms: ["headache"]
              },
              isFinal: false
            })
          }
        }]
      } as any);

      const initialContext = {
        symptoms: [],
        stepCount: 0
      };

      const response = await processConversationalAssessment(
        "I have a headache",
        initialContext
      );

      expect(response.context.stepCount).toBe(1);
    });

    it('should increment stepCount from existing value', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "How severe is the pain?",
              nextQuestionAr: "ما مدى شدة الألم؟",
              extractedData: {
                duration: "2 days"
              },
              isFinal: false
            })
          }
        }]
      } as any);

      const existingContext = {
        symptoms: ["headache"],
        stepCount: 3,
        duration: "2 days"
      };

      const response = await processConversationalAssessment(
        "It's been 2 days",
        existingContext
      );

      expect(response.context.stepCount).toBe(4);
    });

    it('should increment stepCount even when AI fails (fallback)', async () => {
      // Mock AI failure
      vi.mocked(llm.invokeLLM).mockRejectedValue(new Error('AI service unavailable'));

      const initialContext = {
        symptoms: [],
        stepCount: 0
      };

      const response = await processConversationalAssessment(
        "I have a headache",
        initialContext
      );

      // Should use fallback question but still increment
      expect(response.context.stepCount).toBe(1);
      expect(response.message).toBeDefined();
    });

    it('should increment stepCount in fallback from existing value', async () => {
      vi.mocked(llm.invokeLLM).mockRejectedValue(new Error('Parse error'));

      const existingContext = {
        symptoms: ["headache"],
        stepCount: 5
      };

      const response = await processConversationalAssessment(
        "It hurts a lot",
        existingContext
      );

      expect(response.context.stepCount).toBe(6);
    });
  });

  describe('Symptoms Array Accumulation', () => {
    it('should accumulate symptoms across multiple messages', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "Any other symptoms?",
              nextQuestionAr: "هل هناك أعراض أخرى؟",
              extractedData: {
                symptoms: ["fever"]
              },
              isFinal: false
            })
          }
        }]
      } as any);

      const existingContext = {
        symptoms: ["headache", "nausea"],
        stepCount: 2
      };

      const response = await processConversationalAssessment(
        "I also have a fever",
        existingContext
      );

      expect(response.context.symptoms).toContain("headache");
      expect(response.context.symptoms).toContain("nausea");
      expect(response.context.symptoms).toContain("fever");
      expect(response.context.symptoms?.length).toBeGreaterThanOrEqual(3);
    });

    it('should not duplicate symptoms', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "How severe is the headache?",
              nextQuestionAr: "ما مدى شدة الصداع؟",
              extractedData: {
                symptoms: ["headache"]
              },
              isFinal: false
            })
          }
        }]
      } as any);

      const existingContext = {
        symptoms: ["headache"],
        stepCount: 1
      };

      const response = await processConversationalAssessment(
        "The headache is really bad",
        existingContext
      );

      const headacheCount = response.context.symptoms?.filter(s => 
        s.toLowerCase() === "headache"
      ).length || 0;
      
      expect(headacheCount).toBeLessThanOrEqual(1);
    });
  });

  describe('Context Preservation', () => {
    it('should preserve all context fields across messages', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "Any medications?",
              nextQuestionAr: "هل تتناول أي أدوية؟",
              extractedData: {
                severity: "severe"
              },
              isFinal: false
            })
          }
        }]
      } as any);

      const existingContext = {
        symptoms: ["headache", "fever"],
        stepCount: 3,
        duration: "2 days",
        location: "forehead",
        age: 35,
        gender: "male",
        aggravatingFactors: ["bright light"],
        relievingFactors: ["rest"],
        medicalHistory: ["hypertension"]
      };

      const response = await processConversationalAssessment(
        "It's very severe",
        existingContext
      );

      // All previous fields should be preserved
      expect(response.context.symptoms).toEqual(existingContext.symptoms);
      expect(response.context.duration).toBe("2 days");
      expect(response.context.location).toBe("forehead");
      expect(response.context.age).toBe(35);
      expect(response.context.gender).toBe("male");
      expect(response.context.aggravatingFactors).toEqual(["bright light"]);
      expect(response.context.relievingFactors).toEqual(["rest"]);
      expect(response.context.medicalHistory).toEqual(["hypertension"]);
      
      // New field should be added
      expect(response.context.severity).toBe("severe");
      
      // Step count should increment
      expect(response.context.stepCount).toBe(4);
    });

    it('should preserve context even in fallback mode', async () => {
      vi.mocked(llm.invokeLLM).mockRejectedValue(new Error('AI error'));

      const existingContext = {
        symptoms: ["headache", "fever"],
        stepCount: 2,
        duration: "2 days",
        severity: "moderate",
        location: "temples"
      };

      const response = await processConversationalAssessment(
        "It's getting worse",
        existingContext
      );

      // All context should be preserved despite fallback
      expect(response.context.symptoms).toEqual(existingContext.symptoms);
      expect(response.context.duration).toBe("2 days");
      expect(response.context.severity).toBe("moderate");
      expect(response.context.location).toBe("temples");
      expect(response.context.stepCount).toBe(3);
    });
  });

  describe('Conversation History', () => {
    it('should build conversation history across messages', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "How long?",
              nextQuestionAr: "منذ متى؟",
              extractedData: {},
              isFinal: false
            })
          }
        }]
      } as any);

      const existingContext = {
        symptoms: ["headache"],
        stepCount: 1,
        conversationHistory: [
          { role: 'user' as const, content: 'I have a headache' },
          { role: 'assistant' as const, content: 'Tell me more about it' }
        ]
      };

      const response = await processConversationalAssessment(
        "It's very painful",
        existingContext
      );

      expect(response.context.conversationHistory).toBeDefined();
      expect(response.context.conversationHistory?.length).toBeGreaterThan(2);
      
      // Should include the new user message
      const userMessages = response.context.conversationHistory?.filter(
        m => m.role === 'user'
      );
      expect(userMessages?.some(m => m.content === "It's very painful")).toBe(true);
    });
  });

  describe('Context Vector Rehydration', () => {
    it('should properly rehydrate context from plain object', () => {
      const plainContext = {
        symptoms: ["headache", "fever"],
        stepCount: 5,
        duration: "3 days",
        severity: "moderate",
        aggravatingFactors: ["noise"],
        relievingFactors: ["sleep"],
        medicalHistory: ["diabetes"],
        medications: ["metformin"],
        age: 45,
        gender: "female",
        ruledOut: ["migraine"],
        confirmedSymptoms: ["fever"]
      };

      const vector = new ConversationalContextVector(plainContext);

      expect(vector.symptoms).toEqual(["headache", "fever"]);
      expect(vector.stepCount).toBe(5);
      expect(vector.duration).toBe("3 days");
      expect(vector.severity).toBe("moderate");
      expect(vector.aggravatingFactors).toEqual(["noise"]);
      expect(vector.relievingFactors).toEqual(["sleep"]);
      expect(vector.medicalHistory).toEqual(["diabetes"]);
      expect(vector.medications).toEqual(["metformin"]);
      expect(vector.age).toBe(45);
      expect(vector.gender).toBe("female");
      expect(vector.ruledOut).toEqual(["migraine"]);
      expect(vector.confirmedSymptoms).toEqual(["fever"]);
    });

    it('should handle empty/null context gracefully', () => {
      const vector1 = new ConversationalContextVector(null as any);
      expect(vector1.stepCount).toBe(0);
      expect(vector1.symptoms).toEqual([]);

      const vector2 = new ConversationalContextVector(undefined);
      expect(vector2.stepCount).toBe(0);
      expect(vector2.symptoms).toEqual([]);

      const vector3 = new ConversationalContextVector({});
      expect(vector3.stepCount).toBe(0);
      expect(vector3.symptoms).toEqual([]);
    });

    it('should serialize back to JSON correctly', () => {
      const vector = new ConversationalContextVector({
        symptoms: ["headache"],
        stepCount: 3,
        duration: "2 days"
      });

      const json = vector.toJSON();

      expect(json.symptoms).toEqual(["headache"]);
      expect(json.stepCount).toBe(3);
      expect(json.duration).toBe("2 days");
      expect(json).toHaveProperty('aggravatingFactors');
      expect(json).toHaveProperty('relievingFactors');
      expect(json).toHaveProperty('conversationHistory');
    });
  });

  describe('Edge Cases', () => {
    it('should handle stepCount at boundary (step 9 -> 10)', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "Final analysis",
              nextQuestionAr: "التحليل النهائي",
              triage: {
                urgency: "ROUTINE",
                possibleConditions: [],
                recommendations: [],
                recommendationsAr: []
              },
              isFinal: true
            })
          }
        }]
      } as any);

      const finalStepContext = {
        symptoms: ["headache"],
        stepCount: 9
      };

      const response = await processConversationalAssessment(
        "That's all",
        finalStepContext
      );

      expect(response.context.stepCount).toBe(10);
      expect(response.conversationStage).toBe("analyzing");
    });

    it('should handle malformed AI response gracefully', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: "This is not JSON at all!"
          }
        }]
      } as any);

      const context = {
        symptoms: ["headache"],
        stepCount: 2
      };

      const response = await processConversationalAssessment(
        "I'm confused",
        context
      );

      // Should fall back to deterministic question
      expect(response.context.stepCount).toBe(3);
      expect(response.message).toBeDefined();
    });

    it('should handle missing stepCount in input context', async () => {
      vi.mocked(llm.invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              nextQuestion: "Tell me more",
              nextQuestionAr: "أخبرني المزيد",
              extractedData: {},
              isFinal: false
            })
          }
        }]
      } as any);

      const contextWithoutStep = {
        symptoms: ["fever"]
        // stepCount is missing
      };

      const response = await processConversationalAssessment(
        "I have fever",
        contextWithoutStep
      );

      // Should default to 0 and increment to 1
      expect(response.context.stepCount).toBe(1);
    });
  });
});
