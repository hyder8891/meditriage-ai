/**
 * Tests for Conversational Context Vector Rehydration
 * 
 * Verifies that the context vector class properly maintains state
 * across JSON serialization/deserialization cycles (simulating tRPC transfer)
 */

import { describe, it, expect } from 'vitest';
import { ConversationalContextVector, createContextVector } from './conversational-context-vector';

describe('ConversationalContextVector', () => {
  describe('Rehydration from JSON', () => {
    it('should create empty context vector', () => {
      const context = createContextVector();
      
      expect(context.symptoms).toEqual([]);
      expect(context.questionCount).toBe(0);
      expect(context.duration).toBeUndefined();
    });

    it('should rehydrate from plain JSON object', () => {
      // Simulate what happens when context comes back from frontend
      const plainJson = {
        symptoms: ['headache', 'fever'],
        duration: '2 days',
        severity: 'moderate',
        questionCount: 3,
        aggravatingFactors: ['stress'],
        medications: ['ibuprofen']
      };

      // This is what the router does - creates class instance from JSON
      const rehydrated = createContextVector(plainJson);

      // Verify data is preserved
      expect(rehydrated.symptoms).toEqual(['headache', 'fever']);
      expect(rehydrated.duration).toBe('2 days');
      expect(rehydrated.severity).toBe('moderate');
      expect(rehydrated.questionCount).toBe(3);
      expect(rehydrated.aggravatingFactors).toEqual(['stress']);
      expect(rehydrated.medications).toEqual(['ibuprofen']);
    });

    it('should have working methods after rehydration', () => {
      // Start with plain JSON (as if from frontend)
      const plainJson = {
        symptoms: ['headache'],
        questionCount: 2
      };

      // Rehydrate
      const context = createContextVector(plainJson);

      // Test that methods work (this is the critical fix!)
      context.updateSymptoms(['fever', 'chills']);
      context.incrementQuestionCount();

      expect(context.symptoms).toEqual(['headache', 'fever', 'chills']);
      expect(context.questionCount).toBe(3);
    });
  });

  describe('Method functionality', () => {
    it('should prevent duplicate symptoms', () => {
      const context = createContextVector();
      
      context.updateSymptoms(['headache', 'fever']);
      context.updateSymptoms(['fever', 'nausea']); // fever is duplicate
      
      expect(context.symptoms).toEqual(['headache', 'fever', 'nausea']);
      expect(context.symptoms.length).toBe(3);
    });

    it('should increment question count', () => {
      const context = createContextVector();
      
      expect(context.questionCount).toBe(0);
      context.incrementQuestionCount();
      expect(context.questionCount).toBe(1);
      context.incrementQuestionCount();
      expect(context.questionCount).toBe(2);
    });

    it('should identify missing critical info', () => {
      const context = createContextVector();
      
      // Empty context should have many missing fields
      const missing = context.getMissingCriticalInfo();
      expect(missing).toContain('symptoms');
      expect(missing).toContain('duration');
      expect(missing).toContain('severity');
      
      // Add symptoms
      context.updateSymptoms(['headache']);
      const stillMissing = context.getMissingCriticalInfo();
      expect(stillMissing).not.toContain('symptoms');
      expect(stillMissing).toContain('duration');
    });

    it('should calculate completeness score', () => {
      const context = createContextVector();
      
      // Empty context = low score
      expect(context.getCompletenessScore()).toBeLessThan(20);
      
      // Add core info
      context.updateSymptoms(['headache']);
      context.duration = '2 days';
      context.severity = 'moderate';
      context.age = 30;
      
      // Should have higher score now
      expect(context.getCompletenessScore()).toBeGreaterThan(40);
    });
  });

  describe('Serialization round-trip', () => {
    it('should survive JSON serialization/deserialization', () => {
      // Create context with data
      const original = createContextVector();
      original.updateSymptoms(['headache', 'fever']);
      original.duration = '3 days';
      original.severity = 'moderate';
      original.incrementQuestionCount();
      original.incrementQuestionCount();

      // Serialize to JSON (simulating tRPC sending to frontend)
      const json = original.toJSON();
      
      // Simulate network transfer (JSON.stringify/parse)
      const transferred = JSON.parse(JSON.stringify(json));
      
      // Rehydrate (simulating frontend sending back to server)
      const rehydrated = createContextVector(transferred);

      // Verify all data is preserved
      expect(rehydrated.symptoms).toEqual(['headache', 'fever']);
      expect(rehydrated.duration).toBe('3 days');
      expect(rehydrated.severity).toBe('moderate');
      expect(rehydrated.questionCount).toBe(2);

      // Verify methods still work after round-trip
      rehydrated.updateSymptoms(['nausea']);
      rehydrated.incrementQuestionCount();
      
      expect(rehydrated.symptoms).toEqual(['headache', 'fever', 'nausea']);
      expect(rehydrated.questionCount).toBe(3);
    });
  });

  describe('The Amnesiac Brain Bug (Fixed)', () => {
    it('should NOT lose memory across multiple turns', () => {
      // Turn 1: User says "I have a headache"
      let context = createContextVector();
      context.updateSymptoms(['headache']);
      context.incrementQuestionCount();
      
      // Serialize and send to frontend
      let json = context.toJSON();
      
      // Turn 2: Frontend sends back, user says "It started 2 days ago"
      // WITHOUT FIX: This would create plain object with no methods
      // WITH FIX: We rehydrate into class instance
      context = createContextVector(json);
      context.duration = '2 days';
      context.incrementQuestionCount();
      
      // Verify we still remember the headache from turn 1
      expect(context.symptoms).toContain('headache');
      expect(context.questionCount).toBe(2);
      
      json = context.toJSON();
      
      // Turn 3: User says "I also have a fever"
      context = createContextVector(json);
      context.updateSymptoms(['fever']); // This would crash without the fix!
      context.incrementQuestionCount();
      
      // Verify cumulative memory
      expect(context.symptoms).toEqual(['headache', 'fever']);
      expect(context.duration).toBe('2 days');
      expect(context.questionCount).toBe(3);
      
      // This is the key test: AI should remember ALL previous answers
      expect(context.getSummary()).toContain('headache');
      expect(context.getSummary()).toContain('fever');
      expect(context.getSummary()).toContain('2 days');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined/null values gracefully', () => {
      const context = createContextVector({
        symptoms: undefined as any,
        duration: null as any,
        questionCount: undefined as any
      });

      expect(context.symptoms).toEqual([]);
      // Note: null is preserved as null, not converted to undefined
      expect(context.duration).toBeNull();
      expect(context.questionCount).toBe(0);
    });

    it('should handle empty arrays correctly', () => {
      const context = createContextVector({
        symptoms: [],
        aggravatingFactors: [],
        medications: []
      });

      expect(context.symptoms).toEqual([]);
      expect(context.aggravatingFactors).toEqual([]);
      expect(context.medications).toEqual([]);
    });
  });
});
