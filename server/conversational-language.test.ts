import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationalContextVector } from './conversational-context-vector';

describe('ConversationalContextVector Language Persistence', () => {
  describe('Language field in context vector', () => {
    it('should default to "en" when no language is provided', () => {
      const vector = new ConversationalContextVector({});
      expect(vector.language).toBe('en');
    });

    it('should store "ar" language when provided', () => {
      const vector = new ConversationalContextVector({ language: 'ar' });
      expect(vector.language).toBe('ar');
    });

    it('should store "en" language when provided', () => {
      const vector = new ConversationalContextVector({ language: 'en' });
      expect(vector.language).toBe('en');
    });

    it('should default to "en" for invalid language values', () => {
      const vector = new ConversationalContextVector({ language: 'invalid' });
      expect(vector.language).toBe('en');
    });

    it('should default to "en" for null language', () => {
      const vector = new ConversationalContextVector({ language: null });
      expect(vector.language).toBe('en');
    });

    it('should default to "en" for undefined language', () => {
      const vector = new ConversationalContextVector({ language: undefined });
      expect(vector.language).toBe('en');
    });
  });

  describe('Language persistence through toJSON', () => {
    it('should include language in toJSON output', () => {
      const vector = new ConversationalContextVector({ language: 'ar' });
      const json = vector.toJSON();
      expect(json.language).toBe('ar');
    });

    it('should preserve Arabic language through serialization/deserialization', () => {
      // Simulate conversation flow
      const initialVector = new ConversationalContextVector({ language: 'ar' });
      initialVector.addSymptoms(['صداع', 'حمى']);
      initialVector.stepCount = 1;
      
      // Serialize (what happens when sent to frontend)
      const serialized = initialVector.toJSON();
      
      // Deserialize (what happens when received back from frontend)
      const rehydratedVector = new ConversationalContextVector(serialized);
      
      expect(rehydratedVector.language).toBe('ar');
      expect(rehydratedVector.symptoms).toContain('صداع');
      expect(rehydratedVector.stepCount).toBe(1);
    });

    it('should preserve language through multiple conversation turns', () => {
      // Turn 1: Start conversation
      let vector = new ConversationalContextVector({ language: 'ar' });
      vector.addSymptoms(['ألم في الرأس']);
      vector.stepCount = 1;
      let json = vector.toJSON();
      
      // Turn 2: Continue conversation
      vector = new ConversationalContextVector(json);
      expect(vector.language).toBe('ar');
      vector.addSymptoms(['غثيان']);
      vector.stepCount = 2;
      json = vector.toJSON();
      
      // Turn 3: Continue conversation
      vector = new ConversationalContextVector(json);
      expect(vector.language).toBe('ar');
      vector.addSymptoms(['دوخة']);
      vector.stepCount = 3;
      json = vector.toJSON();
      
      // Turn 4: Continue conversation
      vector = new ConversationalContextVector(json);
      expect(vector.language).toBe('ar');
      vector.stepCount = 4;
      json = vector.toJSON();
      
      // Turn 5: Continue conversation (this is where the bug was occurring)
      vector = new ConversationalContextVector(json);
      expect(vector.language).toBe('ar');
      expect(vector.stepCount).toBe(4);
      
      // Final check - language should still be Arabic after 5 turns
      expect(vector.language).toBe('ar');
    });
  });

  describe('Context rehydration edge cases', () => {
    it('should handle empty context object', () => {
      const vector = new ConversationalContextVector({});
      expect(vector.language).toBe('en');
      expect(vector.symptoms).toEqual([]);
      expect(vector.stepCount).toBe(0);
    });

    it('should handle null context', () => {
      const vector = new ConversationalContextVector(null);
      expect(vector.language).toBe('en');
    });

    it('should handle undefined context', () => {
      const vector = new ConversationalContextVector(undefined);
      expect(vector.language).toBe('en');
    });

    it('should preserve all fields including language', () => {
      const originalData = {
        language: 'ar',
        symptoms: ['صداع', 'حمى'],
        confirmedSymptoms: ['صداع'],
        ruledOut: [],
        stepCount: 3,
        duration: 'يومين',
        severity: '7',
        location: 'الرأس',
        conversationHistory: [
          { role: 'user' as const, content: 'عندي صداع' },
          { role: 'assistant' as const, content: 'منذ متى تعاني من الصداع؟' }
        ],
        medicalHistory: ['ضغط الدم'],
        medications: ['أسبرين']
      };
      
      const vector = new ConversationalContextVector(originalData);
      const json = vector.toJSON();
      
      expect(json.language).toBe('ar');
      expect(json.symptoms).toEqual(['صداع', 'حمى']);
      expect(json.stepCount).toBe(3);
      expect(json.duration).toBe('يومين');
      expect(json.severity).toBe('7');
      expect(json.conversationHistory).toHaveLength(2);
    });
  });
});
