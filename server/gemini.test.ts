import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getModelForTask, type TaskComplexity } from './_core/gemini';

// Mock the fetch function
global.fetch = vi.fn();

describe('Gemini Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getModelForTask - Model Selection Logic', () => {
    // Pro model tasks (accuracy-critical)
    it('should return "pro" for medical_imaging task', () => {
      expect(getModelForTask('medical_imaging')).toBe('pro');
    });

    it('should return "pro" for clinical_reasoning task', () => {
      expect(getModelForTask('clinical_reasoning')).toBe('pro');
    });

    it('should return "pro" for differential_diagnosis task', () => {
      expect(getModelForTask('differential_diagnosis')).toBe('pro');
    });

    it('should return "pro" for drug_interaction task', () => {
      expect(getModelForTask('drug_interaction')).toBe('pro');
    });

    it('should return "pro" for lab_analysis task', () => {
      expect(getModelForTask('lab_analysis')).toBe('pro');
    });

    // Flash model tasks (fast response)
    it('should return "flash" for triage task', () => {
      expect(getModelForTask('triage')).toBe('flash');
    });

    it('should return "flash" for chat task', () => {
      expect(getModelForTask('chat')).toBe('flash');
    });

    it('should return "flash" for simple_query task', () => {
      expect(getModelForTask('simple_query')).toBe('flash');
    });

    it('should return "flash" for translation task', () => {
      expect(getModelForTask('translation')).toBe('flash');
    });

    it('should return "flash" for summarization task', () => {
      expect(getModelForTask('summarization')).toBe('flash');
    });
  });

  describe('Model Selection - Batch Verification', () => {
    const proTasks: TaskComplexity[] = [
      'medical_imaging',
      'clinical_reasoning',
      'differential_diagnosis',
      'drug_interaction',
      'lab_analysis',
    ];

    const flashTasks: TaskComplexity[] = [
      'triage',
      'chat',
      'simple_query',
      'translation',
      'summarization',
    ];

    it('should route all accuracy-critical tasks to Pro model', () => {
      for (const task of proTasks) {
        const result = getModelForTask(task);
        expect(result).toBe('pro');
      }
    });

    it('should route all fast-response tasks to Flash model', () => {
      for (const task of flashTasks) {
        const result = getModelForTask(task);
        expect(result).toBe('flash');
      }
    });

    it('should have exactly 5 Pro tasks and 5 Flash tasks', () => {
      expect(proTasks.length).toBe(5);
      expect(flashTasks.length).toBe(5);
    });
  });
});
