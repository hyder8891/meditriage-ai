/**
 * Tests for Conversational Assessment System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processConversationalAssessment } from './conversational-assessment-integrated';

// Mock dependencies
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn()
}));

vi.mock('./brain/brain-enhanced', () => ({
  enhancedBrain: {
    reason: vi.fn()
  }
}));

vi.mock('./brain/index', () => ({
  BRAIN: vi.fn().mockImplementation(() => ({
    reason: vi.fn()
  }))
}));

vi.mock('./brain/orchestrator', () => ({
  executeAvicennaLoop: vi.fn()
}));

import { invokeLLM } from './_core/llm';
import { BRAIN } from './brain/index';

describe('Conversational Assessment System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Greeting Stage', () => {
    it('should respond with greeting and quick reply chips for first message', async () => {
      // Mock LLM response for extracting symptoms (JSON format)
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({ symptoms: ["headache"] })
          }
        }]
      });
      
      // Mock LLM response for greeting message
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: "I understand you're experiencing headaches. How long have you had these symptoms?"
          }
        }]
      });

      const response = await processConversationalAssessment(
        "I have a headache",
        [], // Empty history = greeting stage
        {}
      );

      expect(response.conversationStage).toBe('gathering');
      expect(response.message).toBeTruthy();
      expect(response.quickReplies).toBeDefined();
      expect(response.quickReplies!.length).toBeGreaterThan(0);
    });

    it('should include Arabic translations in quick reply chips', async () => {
      // Mock symptom extraction
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({ symptoms: ["sick"] })
          }
        }]
      });
      
      // Mock greeting message
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: "Tell me more about your symptoms."
          }
        }]
      });

      const response = await processConversationalAssessment(
        "I feel sick",
        [],
        {}
      );

      expect(response.quickReplies).toBeDefined();
      const firstChip = response.quickReplies![0];
      expect(firstChip.textAr).toBeDefined();
      expect(firstChip.text).toBeDefined();
      expect(firstChip.value).toBeDefined();
    });
  });

  describe('Context Gathering Stage', () => {
    it('should extract context from user messages', async () => {
      // Mock context extraction
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              symptoms: ["headache"],
              duration: "2 days",
              severity: "moderate"
            })
          }
        }]
      });

      // Mock follow-up question
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: "Does anything make the headache worse?"
          }
        }]
      });

      const response = await processConversationalAssessment(
        "I've had a moderate headache for 2 days",
        [{
          role: "assistant",
          content: "Tell me about your symptoms",
          timestamp: Date.now()
        }],
        {}
      );

      expect(response.conversationStage).toBe('gathering');
      expect(response.message).toBeTruthy();
    });

    it('should generate contextual quick replies based on missing information', async () => {
      // Mock context extraction
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({ symptoms: ["fever"] })
          }
        }]
      });
      
      // Mock follow-up question
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: "How long have you had this fever?"
          }
        }]
      });

      const response = await processConversationalAssessment(
        "I have a fever",
        [{
          role: "assistant",
          content: "Hello",
          timestamp: Date.now()
        }],
        { symptoms: ["fever"] }
      );

      // Should ask about duration or severity
      expect(response.quickReplies).toBeDefined();
    });
  });

  describe('Analysis Stage', () => {
    it('should analyze symptoms with BRAIN when sufficient context is gathered', async () => {
      // Mock BRAIN analysis
      const mockBrainInstance = {
        reason: vi.fn().mockResolvedValueOnce({
        diagnosis: {
          differentialDiagnosis: [
            {
              condition: "Tension Headache",
              probability: 0.7,
              reasoning: "Common presentation with stress",
              confidenceScore: 75,
              evidenceStrength: "B"
            },
            {
              condition: "Migraine",
              probability: 0.2,
              reasoning: "Moderate severity suggests possibility",
              confidenceScore: 60,
              evidenceStrength: "C"
            }
          ],
          redFlags: [],
          recommendations: {
            immediateActions: [],
            tests: [],
            imaging: [],
            referrals: []
          },
          confidence: 0.7,
          overallConfidenceScore: 70,
          clinicalGuidelineCompliance: "Follows standard diagnostic criteria",
          requiresUrgentCare: false
        },
        accuracyMetrics: {}
        })
      };
      (BRAIN as any).mockImplementation(() => mockBrainInstance);

      // Mock Arabic translations (multiple calls)
      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: "Translated text"
          }
        }]
      });

      const response = await processConversationalAssessment(
        "Nothing specific makes it worse",
        [{ role: "assistant", content: "Hello", timestamp: Date.now() }], // Non-empty history
        {
          symptoms: ["headache"],
          duration: "2 days",
          severity: "moderate",
          stepCount: 7 // Trigger analysis stage
        }
      );

      expect(mockBrainInstance.reason).toHaveBeenCalled();
      expect(response.conversationStage).toBe('complete');
      expect(response.triageLevel).toBeDefined();
      expect(response.differentialDiagnosis).toBeDefined();
      expect(response.recommendations).toBeDefined();
      expect(response.showActions).toBe(true);
    });

    it('should determine correct triage level based on symptoms', async () => {
      // Mock symptom extraction
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ symptoms: [] }) } }]
      });
      
      (BRAIN as any)().reason.mockResolvedValue({
        diagnosis: {
          differentialDiagnosis: [],
          redFlags: [],
          recommendations: { immediateActions: [], tests: [], imaging: [], referrals: [] },
          confidence: 0.8,
          overallConfidenceScore: 80,
          clinicalGuidelineCompliance: "Standard",
          requiresUrgentCare: false
        },
        accuracyMetrics: {}
      });

      // Test mild symptoms = green
      const greenResponse = await processConversationalAssessment(
        "It's mild",
        [{ role: "assistant", content: "Hello", timestamp: Date.now() }],
        {
          symptoms: ["headache"],
          duration: "today",
          severity: "mild",
          stepCount: 7 // Trigger analysis stage
        }
      );

      expect(greenResponse.triageLevel).toBe('green');

      // Reset mocks for red test
      vi.clearAllMocks();
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ symptoms: [] }) } }]
      });
      (BRAIN as any)().reason.mockResolvedValue({
        diagnosis: {
          differentialDiagnosis: [],
          redFlags: [],
          recommendations: { immediateActions: [], tests: [], imaging: [], referrals: [] },
          confidence: 0.8,
          overallConfidenceScore: 80,
          clinicalGuidelineCompliance: "Standard",
          requiresUrgentCare: false
        },
        accuracyMetrics: {}
      });

      // Test severe symptoms = red
      const redResponse = await processConversationalAssessment(
        "It's severe",
        [{ role: "assistant", content: "Hello", timestamp: Date.now() }],
        {
          symptoms: ["chest pain"],
          duration: "1 hour",
          severity: "severe",
          stepCount: 7 // Trigger analysis stage
        }
      );

      expect(redResponse.triageLevel).toBe('red');
    });

    it('should include action buttons after analysis', async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ symptoms: [] }) } }]
      });
      
      (BRAIN as any)().reason.mockResolvedValue({
        diagnosis: {
          differentialDiagnosis: [],
          redFlags: [],
          recommendations: { immediateActions: [], tests: [], imaging: [], referrals: [] },
          confidence: 0.7,
          overallConfidenceScore: 70,
          clinicalGuidelineCompliance: "Standard",
          requiresUrgentCare: false
        },
        accuracyMetrics: {}
      });

      const response = await processConversationalAssessment(
        "Done",
        [{ role: "assistant", content: "Hello", timestamp: Date.now() }],
        {
          symptoms: ["fever"],
          duration: "2 days",
          severity: "moderate",
          stepCount: 7 // Trigger analysis stage
        }
      );

      expect(response.showActions).toBe(true);
    });
  });

  describe('Triage Level Determination', () => {
    it('should flag red for emergency symptoms', async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ symptoms: [] }) } }]
      });
      
      (BRAIN as any)().reason.mockResolvedValue({
        diagnosis: {
          differentialDiagnosis: [],
          redFlags: [],
          recommendations: { immediateActions: [], tests: [], imaging: [], referrals: [] },
          confidence: 0.9,
          overallConfidenceScore: 90,
          clinicalGuidelineCompliance: "Emergency protocols",
          requiresUrgentCare: true
        },
        accuracyMetrics: {}
      });

      const response = await processConversationalAssessment(
        "I have severe chest pain",
        [{ role: "assistant", content: "Hello", timestamp: Date.now() }],
        {
          symptoms: ["chest pain", "difficulty breathing"],
          duration: "30 minutes",
          severity: "severe",
          stepCount: 7 // Trigger analysis stage
        }
      );

      expect(response.triageLevel).toBe('red');
      expect(response.triageReason).toContain('immediate');
    });

    it('should flag yellow for urgent but non-emergency symptoms', async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ symptoms: [] }) } }]
      });
      
      (BRAIN as any)().reason.mockResolvedValue({
        diagnosis: {
          differentialDiagnosis: [],
          redFlags: [],
          recommendations: { immediateActions: [], tests: [], imaging: [], referrals: [] },
          confidence: 0.7,
          overallConfidenceScore: 70,
          clinicalGuidelineCompliance: "Standard",
          requiresUrgentCare: false
        },
        accuracyMetrics: {}
      });

      const response = await processConversationalAssessment(
        "Moderate pain for a week",
        [{ role: "assistant", content: "Hello", timestamp: Date.now() }],
        {
          symptoms: ["pain"],
          duration: "1 week",
          severity: "moderate",
          stepCount: 7 // Trigger analysis stage
        }
      );

      expect(response.triageLevel).toBe('yellow');
    });
  });

  describe('Arabic Support', () => {
    it('should provide Arabic translations for all user-facing text', async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ symptoms: [] }) } }]
      });
      
      (BRAIN as any)().reason.mockResolvedValue({
        diagnosis: {
          differentialDiagnosis: [],
          redFlags: [],
          recommendations: { immediateActions: [], tests: [], imaging: [], referrals: [] },
          confidence: 0.7,
          overallConfidenceScore: 70,
          clinicalGuidelineCompliance: "Standard",
          requiresUrgentCare: false
        },
        accuracyMetrics: {}
      });

      const response = await processConversationalAssessment(
        "Done",
        [{ role: "assistant", content: "Hello", timestamp: Date.now() }],
        {
          symptoms: ["fever"],
          duration: "2 days",
          severity: "moderate",
          stepCount: 7 // Trigger analysis stage
        }
      );

      expect(response.messageAr).toBeDefined();
      expect(response.triageReasonAr).toBeDefined();
      expect(response.recommendationsAr).toBeDefined();
    });
  });
});
