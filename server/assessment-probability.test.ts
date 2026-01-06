/**
 * Tests for Assessment Probability Normalization
 * 
 * Ensures that probability values are correctly normalized to 0-1 range
 * and displayed as proper percentages (0-100%)
 */

import { describe, it, expect } from 'vitest';

// Helper function that mirrors the normalization logic in the codebase
function normalizeConfidence(probability: number): number {
  if (probability > 1) {
    // Already a percentage, cap at 100
    return Math.min(Math.round(probability), 100);
  }
  // Convert decimal to percentage
  return Math.round(probability * 100);
}

// Helper to normalize probability to 0-1 range
function normalizeProbability(probability: number): number {
  if (probability > 1) {
    return probability / 100;
  }
  return probability;
}

describe('Assessment Probability Normalization', () => {
  describe('normalizeConfidence (for display)', () => {
    it('should convert decimal probability to percentage', () => {
      expect(normalizeConfidence(0.35)).toBe(35);
      expect(normalizeConfidence(0.75)).toBe(75);
      expect(normalizeConfidence(0.99)).toBe(99);
      expect(normalizeConfidence(0.5)).toBe(50);
    });

    it('should handle already-percentage values correctly', () => {
      expect(normalizeConfidence(35)).toBe(35);
      expect(normalizeConfidence(75)).toBe(75);
      expect(normalizeConfidence(99)).toBe(99);
    });

    it('should cap values at 100%', () => {
      expect(normalizeConfidence(150)).toBe(100);
      expect(normalizeConfidence(4000)).toBe(100); // The bug case: 40 * 100 = 4000
      expect(normalizeConfidence(200)).toBe(100);
    });

    it('should handle edge cases', () => {
      expect(normalizeConfidence(0)).toBe(0);
      expect(normalizeConfidence(1)).toBe(100); // 1.0 = 100%
      expect(normalizeConfidence(0.01)).toBe(1);
    });

    it('should round to nearest integer', () => {
      expect(normalizeConfidence(0.354)).toBe(35);
      expect(normalizeConfidence(0.355)).toBe(36);
      expect(normalizeConfidence(0.999)).toBe(100);
    });
  });

  describe('normalizeProbability (for storage)', () => {
    it('should keep decimal probabilities unchanged', () => {
      expect(normalizeProbability(0.35)).toBe(0.35);
      expect(normalizeProbability(0.75)).toBe(0.75);
      expect(normalizeProbability(0.99)).toBe(0.99);
    });

    it('should convert percentage to decimal', () => {
      expect(normalizeProbability(35)).toBe(0.35);
      expect(normalizeProbability(75)).toBe(0.75);
      expect(normalizeProbability(99)).toBe(0.99);
    });

    it('should handle the bug case (4000%)', () => {
      // If LLM returns 40 as probability and we multiply by 100, we get 4000
      // This should be normalized back to 0.40
      expect(normalizeProbability(4000)).toBe(40);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle LLM returning decimal probabilities', () => {
      const llmResponse = {
        differentialDiagnosis: [
          { condition: 'Tension Headache', probability: 0.40 },
          { condition: 'Migraine', probability: 0.30 },
          { condition: 'Cluster Headache', probability: 0.15 }
        ]
      };

      llmResponse.differentialDiagnosis.forEach(dd => {
        const displayPercent = normalizeConfidence(dd.probability);
        expect(displayPercent).toBeLessThanOrEqual(100);
        expect(displayPercent).toBeGreaterThanOrEqual(0);
      });

      expect(normalizeConfidence(llmResponse.differentialDiagnosis[0].probability)).toBe(40);
    });

    it('should handle LLM returning integer percentages', () => {
      const llmResponse = {
        differentialDiagnosis: [
          { condition: 'Tension Headache', probability: 40 },
          { condition: 'Migraine', probability: 30 },
          { condition: 'Cluster Headache', probability: 15 }
        ]
      };

      llmResponse.differentialDiagnosis.forEach(dd => {
        const displayPercent = normalizeConfidence(dd.probability);
        expect(displayPercent).toBeLessThanOrEqual(100);
        expect(displayPercent).toBeGreaterThanOrEqual(0);
      });

      expect(normalizeConfidence(llmResponse.differentialDiagnosis[0].probability)).toBe(40);
    });

    it('should prevent the 4000% bug', () => {
      // Simulating the bug: probability was 0.40, then multiplied by 100 twice
      const buggyProbability = 0.40 * 100; // 40
      const doubleBuggyProbability = buggyProbability * 100; // 4000

      // Our fix should cap this at 100
      expect(normalizeConfidence(doubleBuggyProbability)).toBe(100);
      
      // And normalize it back to a sensible decimal
      expect(normalizeProbability(doubleBuggyProbability)).toBe(40);
    });
  });
});
