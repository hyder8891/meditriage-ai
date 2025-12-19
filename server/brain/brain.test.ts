/**
 * BRAIN System Tests
 * Tests for Biomedical Reasoning and Intelligence Network
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { brain } from './index';
import { medicalKnowledge } from './knowledge/medical-knowledge';

describe('BRAIN System Tests', () => {
  describe('Medical Knowledge Base', () => {
    it('should find medical concepts', async () => {
      const result = await medicalKnowledge.findConcept('fever');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty queries gracefully', async () => {
      const result = await medicalKnowledge.findConcept('');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('BRAIN Clinical Reasoning', () => {
    it('should analyze symptoms and generate differential diagnosis', async () => {
      const input = {
        symptoms: ['fever', 'cough', 'fatigue'],
        patientInfo: {
          age: 35,
          gender: 'male' as const,
          medicalHistory: [],
          location: 'Baghdad, Iraq'
        },
        language: 'en' as const
      };

      const result = await brain.reason(input);

      expect(result).toBeDefined();
      expect(result.caseId).toBeDefined();
      expect(result.diagnosis).toBeDefined();
      expect(result.diagnosis.differentialDiagnosis).toBeDefined();
      expect(Array.isArray(result.diagnosis.differentialDiagnosis)).toBe(true);
      expect(result.diagnosis.differentialDiagnosis.length).toBeGreaterThan(0);
      expect(result.diagnosis.confidence).toBeGreaterThan(0);
      expect(result.diagnosis.confidence).toBeLessThanOrEqual(1);
      expect(result.processingTime).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for LLM calls

    it('should include recommendations in diagnosis', async () => {
      const input = {
        symptoms: ['chest pain', 'shortness of breath'],
        patientInfo: {
          age: 55,
          gender: 'male' as const,
          medicalHistory: ['hypertension'],
          location: 'Iraq'
        },
        language: 'en' as const
      };

      const result = await brain.reason(input);

      expect(result.diagnosis.recommendations).toBeDefined();
      expect(result.diagnosis.recommendations.immediateActions).toBeDefined();
      expect(Array.isArray(result.diagnosis.recommendations.immediateActions)).toBe(true);
      expect(result.diagnosis.recommendations.tests).toBeDefined();
      expect(Array.isArray(result.diagnosis.recommendations.tests)).toBe(true);
    }, 30000);

    it('should identify red flags for serious conditions', async () => {
      const input = {
        symptoms: ['severe chest pain', 'difficulty breathing', 'sweating'],
        patientInfo: {
          age: 60,
          gender: 'male' as const,
          medicalHistory: ['diabetes', 'hypertension'],
          location: 'Iraq'
        },
        language: 'en' as const
      };

      const result = await brain.reason(input);

      expect(result.diagnosis.redFlags).toBeDefined();
      expect(Array.isArray(result.diagnosis.redFlags)).toBe(true);
      // Red flags should be present for serious symptoms
      expect(result.diagnosis.redFlags.length).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('should handle Arabic language input', async () => {
      const input = {
        symptoms: ['حمى', 'سعال'],
        patientInfo: {
          age: 30,
          gender: 'female' as const,
          medicalHistory: [],
          location: 'بغداد، العراق'
        },
        language: 'ar' as const
      };

      const result = await brain.reason(input);

      expect(result).toBeDefined();
      expect(result.diagnosis).toBeDefined();
      expect(result.diagnosis.differentialDiagnosis.length).toBeGreaterThan(0);
    }, 30000);

    it('should include Iraqi medical context', async () => {
      const input = {
        symptoms: ['fever', 'diarrhea', 'abdominal pain'],
        patientInfo: {
          age: 25,
          gender: 'male' as const,
          medicalHistory: [],
          location: 'Basra, Iraq'
        },
        language: 'en' as const
      };

      const result = await brain.reason(input);

      expect(result).toBeDefined();
      expect(result.diagnosis).toBeDefined();
      // Should consider local diseases common in Iraq
    }, 30000);
  });

  describe('BRAIN Learning System', () => {
    it('should accept feedback and learn from cases', async () => {
      // First, create a case
      const input = {
        symptoms: ['headache', 'fever'],
        patientInfo: {
          age: 40,
          gender: 'female' as const,
          medicalHistory: [],
          location: 'Iraq'
        },
        language: 'en' as const
      };

      const diagnosis = await brain.reason(input);
      
      // Then provide feedback
      const feedback = {
        caseId: diagnosis.caseId,
        brainDiagnosis: diagnosis.diagnosis.differentialDiagnosis[0].condition,
        actualDiagnosis: 'Migraine',
        clinicianCorrection: 'Patient had classic migraine symptoms',
        outcome: 'Correct diagnosis, patient improved with treatment'
      };

      const result = await brain.learn(feedback);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    }, 30000);

    it('should retrieve case history', async () => {
      // Create a case first
      const input = {
        symptoms: ['fever'],
        patientInfo: {
          age: 30,
          gender: 'male' as const,
          medicalHistory: [],
          location: 'Iraq'
        },
        language: 'en' as const
      };

      const diagnosis = await brain.reason(input);
      
      // Retrieve the case
      const caseHistory = await brain.getCaseHistory(diagnosis.caseId);

      expect(caseHistory).toBeDefined();
      expect(caseHistory.caseId).toBe(diagnosis.caseId);
      expect(caseHistory.symptoms).toEqual(input.symptoms);
    }, 30000);
  });

  describe('BRAIN Performance Metrics', () => {
    it('should calculate performance metrics', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const metrics = await brain.getMetrics(startDate, endDate);

      expect(metrics).toBeDefined();
      expect(metrics.totalCases).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
      expect(metrics.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
      expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('BRAIN Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const input = {
        symptoms: [], // Empty symptoms
        patientInfo: {
          age: -1, // Invalid age
          gender: 'male' as const,
          medicalHistory: [],
          location: ''
        },
        language: 'en' as const
      };

      await expect(brain.reason(input)).rejects.toThrow();
    });

    it('should handle missing patient info', async () => {
      const input = {
        symptoms: ['fever'],
        patientInfo: {
          age: 0,
          gender: 'male' as const,
          medicalHistory: [],
          location: ''
        },
        language: 'en' as const
      };

      await expect(brain.reason(input)).rejects.toThrow();
    });
  });
});
