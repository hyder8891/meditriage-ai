/**
 * BRAIN Performance Testing Suite
 * Validates diagnostic accuracy across 100 clinical case scenarios
 * 
 * Test Categories:
 * - Emergency Cases (20)
 * - Common Conditions (30)
 * - Complex Cases (20)
 * - Pediatric Cases (10)
 * - Geriatric Cases (10)
 * - Iraqi-Specific Cases (10)
 */

import { describe, it, expect } from 'vitest';
import { brain } from './index';
import { testCases, type TestCase } from './test-cases';

// Performance metrics
interface TestResult {
  caseId: string;
  category: string;
  difficulty: string;
  passed: boolean;
  expectedDiagnosis: string;
  actualTopDiagnosis: string;
  confidence: number;
  expectedConfidence: number;
  urgencyMatch: boolean;
  expectedUrgency: string;
  actualUrgency: string;
  diagnosisInTop3: boolean;
  executionTime: number;
}

const testResults: TestResult[] = [];

// Helper function to check if diagnosis matches (fuzzy matching)
function diagnosisMatches(actual: string, expected: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const actualNorm = normalize(actual);
  const expectedNorm = normalize(expected);
  
  // Exact match
  if (actualNorm === expectedNorm) return true;
  
  // Contains match (for compound diagnoses)
  if (actualNorm.includes(expectedNorm) || expectedNorm.includes(actualNorm)) return true;
  
  // Synonym matching
  const synonyms: Record<string, string[]> = {
    'myocardialinfarction': ['mi', 'heartattack', 'stemi', 'nstemi', 'acutecoronarysyndrome'],
    'stroke': ['cva', 'cerebrovascularaccident', 'ischemicstroke', 'brain attack'],
    'appendicitis': ['acuteappendicitis'],
    'pneumonia': ['communityacquiredpneumonia', 'cap', 'bacterialpneumonia'],
    'asthma': ['asthmaexacerbation', 'acuteasthma', 'bronchialasthma'],
    'diabetesketoacidosis': ['dka', 'diabeticketoacidosis'],
    'pulmonaryembolism': ['pe', 'embolism'],
    'sepsis': ['septicsho ck', 'septicemia', 'urosepsis'],
  };
  
  for (const [key, syns] of Object.entries(synonyms)) {
    if ((actualNorm === key || syns.includes(actualNorm)) && 
        (expectedNorm === key || syns.includes(expectedNorm))) {
      return true;
    }
  }
  
  return false;
}

// Helper function to run BRAIN analysis on a test case
async function runBRAINTest(testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const result = await brain.reason({
      symptoms: [testCase.chiefComplaint, testCase.symptoms],
      patientInfo: {
        age: testCase.patientAge,
        gender: testCase.patientGender,
        location: 'Iraq'
      },
      vitalSigns: testCase.vitals,
      language: 'en'
    });
    
    const executionTime = Date.now() - startTime;
    
    // Extract top diagnosis
    const topDiagnosis = result.diagnosis.differentialDiagnosis[0];
    const actualTopDiagnosis = topDiagnosis?.condition || 'Unknown';
    const confidence = topDiagnosis?.probability || 0;
    
    // Check if expected diagnosis is in top 3
    const top3Diagnoses = result.diagnosis.differentialDiagnosis.slice(0, 3).map(d => d.condition);
    const diagnosisInTop3 = top3Diagnoses.some(d => diagnosisMatches(d, testCase.expectedDiagnosis));
    
    // Check if top diagnosis matches expected
    const passed = diagnosisMatches(actualTopDiagnosis, testCase.expectedDiagnosis);
    
    // Determine urgency from red flags and recommendations
    const hasRedFlags = result.diagnosis.redFlags.length > 0;
    const hasImmediateActions = result.diagnosis.recommendations.immediateActions.length > 0;
    const actualUrgency = hasRedFlags || hasImmediateActions ? 'emergency' : 'routine';
    const urgencyMatch = actualUrgency === testCase.expectedUrgency;
    
    return {
      caseId: testCase.id,
      category: testCase.category,
      difficulty: testCase.difficulty,
      passed,
      expectedDiagnosis: testCase.expectedDiagnosis,
      actualTopDiagnosis,
      confidence,
      expectedConfidence: testCase.expectedConfidence,
      urgencyMatch,
      expectedUrgency: testCase.expectedUrgency,
      actualUrgency,
      diagnosisInTop3,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      caseId: testCase.id,
      category: testCase.category,
      difficulty: testCase.difficulty,
      passed: false,
      expectedDiagnosis: testCase.expectedDiagnosis,
      actualTopDiagnosis: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0,
      expectedConfidence: testCase.expectedConfidence,
      urgencyMatch: false,
      expectedUrgency: testCase.expectedUrgency,
      actualUrgency: 'error',
      diagnosisInTop3: false,
      executionTime,
    };
  }
}

// Generate performance report
function generatePerformanceReport(): string {
  const totalCases = testResults.length;
  const passedCases = testResults.filter(r => r.passed).length;
  const top3Accuracy = testResults.filter(r => r.diagnosisInTop3).length;
  const urgencyAccuracy = testResults.filter(r => r.urgencyMatch).length;
  
  const accuracyRate = ((passedCases / totalCases) * 100).toFixed(2);
  const top3Rate = ((top3Accuracy / totalCases) * 100).toFixed(2);
  const urgencyRate = ((urgencyAccuracy / totalCases) * 100).toFixed(2);
  
  const avgExecutionTime = (testResults.reduce((sum, r) => sum + r.executionTime, 0) / totalCases).toFixed(0);
  
  // Category breakdown
  const categories = ['emergency', 'common', 'complex', 'pediatric', 'geriatric', 'iraqi-specific'];
  const categoryStats = categories.map(cat => {
    const catResults = testResults.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    const catTotal = catResults.length;
    const catAccuracy = catTotal > 0 ? ((catPassed / catTotal) * 100).toFixed(2) : '0.00';
    return `  ${cat}: ${catPassed}/${catTotal} (${catAccuracy}%)`;
  });
  
  // Difficulty breakdown
  const difficulties = ['easy', 'medium', 'hard'];
  const difficultyStats = difficulties.map(diff => {
    const diffResults = testResults.filter(r => r.difficulty === diff);
    const diffPassed = diffResults.filter(r => r.passed).length;
    const diffTotal = diffResults.length;
    const diffAccuracy = diffTotal > 0 ? ((diffPassed / diffTotal) * 100).toFixed(2) : '0.00';
    return `  ${diff}: ${diffPassed}/${diffTotal} (${diffAccuracy}%)`;
  });
  
  // Failed cases
  const failedCases = testResults.filter(r => !r.passed);
  const failedCasesList = failedCases.slice(0, 10).map(r => 
    `  ${r.caseId}: Expected "${r.expectedDiagnosis}", Got "${r.actualTopDiagnosis}"`
  );
  
  return `
╔══════════════════════════════════════════════════════════════════╗
║           BRAIN PERFORMANCE TEST REPORT                          ║
╚══════════════════════════════════════════════════════════════════╝

📊 OVERALL METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Cases Tested:        ${totalCases}
  Top-1 Accuracy:            ${passedCases}/${totalCases} (${accuracyRate}%)
  Top-3 Accuracy:            ${top3Accuracy}/${totalCases} (${top3Rate}%)
  Urgency Accuracy:          ${urgencyAccuracy}/${totalCases} (${urgencyRate}%)
  Average Execution Time:    ${avgExecutionTime}ms

📁 CATEGORY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${categoryStats.join('\n')}

🎯 DIFFICULTY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${difficultyStats.join('\n')}

❌ FAILED CASES (Top 10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${failedCasesList.length > 0 ? failedCasesList.join('\n') : '  None - All tests passed!'}

✅ PERFORMANCE TARGETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Target Top-1 Accuracy:     ≥85% ${parseFloat(accuracyRate) >= 85 ? '✓' : '✗'}
  Target Top-3 Accuracy:     ≥95% ${parseFloat(top3Rate) >= 95 ? '✓' : '✗'}
  Target Urgency Accuracy:   ≥90% ${parseFloat(urgencyRate) >= 90 ? '✓' : '✗'}
  Target Execution Time:     <3000ms ${parseInt(avgExecutionTime) < 3000 ? '✓' : '✗'}

`;
}

// Main test suite
describe('BRAIN Performance Testing Suite', () => {
  describe('Emergency Cases (20 cases)', () => {
    const emergencyCases = testCases.filter(tc => tc.category === 'emergency');
    
    it.each(emergencyCases)('$id: $chiefComplaint', async (testCase) => {
      const result = await runBRAINTest(testCase);
      testResults.push(result);
      
      // Assertions
      expect(result.diagnosisInTop3).toBe(true);
      expect(result.urgencyMatch || result.actualUrgency === 'emergency').toBe(true);
    }, 30000); // 30s timeout per test
  });

  describe('Common Conditions (30 cases)', () => {
    const commonCases = testCases.filter(tc => tc.category === 'common');
    
    it.each(commonCases)('$id: $chiefComplaint', async (testCase) => {
      const result = await runBRAINTest(testCase);
      testResults.push(result);
      
      // Assertions
      expect(result.diagnosisInTop3).toBe(true);
    }, 30000);
  });

  describe('Complex Cases (20 cases)', () => {
    const complexCases = testCases.filter(tc => tc.category === 'complex');
    
    it.each(complexCases)('$id: $chiefComplaint', async (testCase) => {
      const result = await runBRAINTest(testCase);
      testResults.push(result);
      
      // Complex cases are harder, so we accept top-3 accuracy
      expect(result.diagnosisInTop3).toBe(true);
    }, 30000);
  });

  describe('Pediatric Cases (10 cases)', () => {
    const pediatricCases = testCases.filter(tc => tc.category === 'pediatric');
    
    it.each(pediatricCases)('$id: $chiefComplaint', async (testCase) => {
      const result = await runBRAINTest(testCase);
      testResults.push(result);
      
      // Assertions
      expect(result.diagnosisInTop3).toBe(true);
    }, 30000);
  });

  describe('Geriatric Cases (10 cases)', () => {
    const geriatricCases = testCases.filter(tc => tc.category === 'geriatric');
    
    it.each(geriatricCases)('$id: $chiefComplaint', async (testCase) => {
      const result = await runBRAINTest(testCase);
      testResults.push(result);
      
      // Assertions
      expect(result.diagnosisInTop3).toBe(true);
    }, 30000);
  });

  describe('Iraqi-Specific Cases (10 cases)', () => {
    const iraqiCases = testCases.filter(tc => tc.category === 'iraqi-specific');
    
    it.each(iraqiCases)('$id: $chiefComplaint', async (testCase) => {
      const result = await runBRAINTest(testCase);
      testResults.push(result);
      
      // Assertions
      expect(result.diagnosisInTop3).toBe(true);
    }, 30000);
  });

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', () => {
      const report = generatePerformanceReport();
      console.log(report);
      
      // Write report to file
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join(__dirname, '../../brain-performance-report.txt');
      fs.writeFileSync(reportPath, report);
      
      // Performance assertions
      const totalCases = testResults.length;
      const passedCases = testResults.filter(r => r.passed).length;
      const top3Accuracy = testResults.filter(r => r.diagnosisInTop3).length;
      const urgencyAccuracy = testResults.filter(r => r.urgencyMatch).length;
      
      const accuracyRate = (passedCases / totalCases) * 100;
      const top3Rate = (top3Accuracy / totalCases) * 100;
      const urgencyRate = (urgencyAccuracy / totalCases) * 100;
      
      // Targets
      expect(totalCases).toBe(100);
      expect(accuracyRate).toBeGreaterThanOrEqual(70); // 70% top-1 accuracy minimum
      expect(top3Rate).toBeGreaterThanOrEqual(85); // 85% top-3 accuracy minimum
      expect(urgencyRate).toBeGreaterThanOrEqual(80); // 80% urgency accuracy minimum
    });
  });
});

// Export results for external analysis
export { testResults, generatePerformanceReport };
