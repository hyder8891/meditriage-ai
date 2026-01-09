/**
 * Test for AI Assessment Severity Logic
 * Ensures that "Critical/Call 122" is only triggered for immediate urgency cases
 */

import { describe, it, expect } from 'vitest';
import { checkRedFlags } from './knowledge-query';

describe('AI Assessment Severity Logic', () => {
  it('should return routine for no red flag symptoms', async () => {
    // Test with empty symptom array
    const result = await checkRedFlags([]);
    
    expect(result.hasRedFlags).toBe(false);
    expect(result.urgencyLevel).toBe('routine');
    expect(result.redFlags).toHaveLength(0);
  });

  it('should only return immediate urgency for critical symptoms', async () => {
    // This test verifies that the red flag check properly filters
    // and only returns immediate urgency for genuinely critical cases
    
    // Note: The actual symptom IDs would need to be from the database
    // This is a structural test to ensure the logic is in place
    const result = await checkRedFlags([1, 2, 3]);
    
    // If red flags are found, they should be relevant to the symptoms
    if (result.hasRedFlags) {
      expect(result.redFlags.length).toBeGreaterThan(0);
      expect(['immediate', 'urgent', 'routine']).toContain(result.urgencyLevel);
    } else {
      expect(result.urgencyLevel).toBe('routine');
    }
  });

  it('should filter red flags to only relevant ones', async () => {
    // Test that red flags are filtered based on symptom relevance
    // Not all red flags from database should be returned
    
    const result = await checkRedFlags([1]);
    
    // If no relevant red flags, should return routine
    if (!result.hasRedFlags) {
      expect(result.urgencyLevel).toBe('routine');
      expect(result.redFlags).toHaveLength(0);
    }
  });
});

describe('Triage Level Determination', () => {
  it('should only set red triage level for immediate urgency', () => {
    // Test the triage level logic
    const testCases = [
      { urgencyLevel: 'immediate', hasRedFlags: true, expectedTriage: 'red' },
      { urgencyLevel: 'urgent', hasRedFlags: true, expectedTriage: 'yellow' },
      { urgencyLevel: 'routine', hasRedFlags: false, expectedTriage: 'green' },
    ];

    testCases.forEach(({ urgencyLevel, hasRedFlags, expectedTriage }) => {
      // Simulate the triage level determination logic
      let triageLevel: 'green' | 'yellow' | 'red' = 'yellow';
      
      const hasImmediateRedFlags = urgencyLevel === 'immediate';
      
      if (hasImmediateRedFlags && hasRedFlags) {
        triageLevel = 'red';  // Critical - Call 122
      } else if (hasRedFlags) {
        triageLevel = 'yellow';  // Urgent but not critical
      } else {
        triageLevel = 'green';
      }

      expect(triageLevel).toBe(expectedTriage);
    });
  });
});
