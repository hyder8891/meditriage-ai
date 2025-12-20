/**
 * BRAIN Sample Performance Test
 * Quick validation with representative cases from each category
 */

import { brain } from './index';
import { testCases } from './test-cases';

interface TestResult {
  caseId: string;
  category: string;
  difficulty: string;
  passed: boolean;
  expectedDiagnosis: string;
  actualTopDiagnosis: string;
  confidence: number;
  diagnosisInTop3: boolean;
  executionTime: number;
  error?: string;
}

// Helper function to check if diagnosis matches (fuzzy matching)
function diagnosisMatches(actual: string, expected: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const actualNorm = normalize(actual);
  const expectedNorm = normalize(expected);
  
  if (actualNorm === expectedNorm) return true;
  if (actualNorm.includes(expectedNorm) || expectedNorm.includes(actualNorm)) return true;
  
  const synonyms: Record<string, string[]> = {
    'myocardialinfarction': ['mi', 'heartattack', 'stemi', 'nstemi', 'acutecoronarysyndrome'],
    'stroke': ['cva', 'cerebrovascularaccident', 'ischemicstroke'],
    'appendicitis': ['acuteappendicitis'],
    'pneumonia': ['communityacquiredpneumonia', 'cap'],
    'asthma': ['asthmaexacerbation', 'acuteasthma'],
  };
  
  for (const [key, syns] of Object.entries(synonyms)) {
    if ((actualNorm === key || syns.includes(actualNorm)) && 
        (expectedNorm === key || syns.includes(expectedNorm))) {
      return true;
    }
  }
  
  return false;
}

async function runSampleTests() {
  console.log('🧠 BRAIN Sample Performance Test\n');
  console.log('Testing representative cases from each category...\n');
  
  // Select sample cases (2 from each category)
  const sampleCases = [
    testCases[0],  // EMG-001: Acute MI
    testCases[5],  // EMG-006: Subarachnoid Hemorrhage
    testCases[20], // COM-001: Pneumonia
    testCases[25], // COM-006: Gastroenteritis
    testCases[50], // CPX-001: Lymphoma
    testCases[55], // CPX-006: Multiple Sclerosis
    testCases[70], // PED-001: Bronchiolitis
    testCases[75], // PED-006: Scarlet Fever
    testCases[80], // GER-001: Hip Fracture
    testCases[85], // GER-006: Normal Pressure Hydrocephalus
    testCases[90], // IRQ-001: Brucellosis
    testCases[95], // IRQ-006: Tuberculosis
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of sampleCases) {
    console.log(`Testing ${testCase.id}: ${testCase.chiefComplaint}...`);
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
      const topDiagnosis = result.diagnosis.differentialDiagnosis[0];
      const actualTopDiagnosis = topDiagnosis?.condition || 'Unknown';
      const confidence = topDiagnosis?.probability || 0;
      
      const top3Diagnoses = result.diagnosis.differentialDiagnosis.slice(0, 3).map(d => d.condition);
      const diagnosisInTop3 = top3Diagnoses.some(d => diagnosisMatches(d, testCase.expectedDiagnosis));
      const passed = diagnosisMatches(actualTopDiagnosis, testCase.expectedDiagnosis);
      
      results.push({
        caseId: testCase.id,
        category: testCase.category,
        difficulty: testCase.difficulty,
        passed,
        expectedDiagnosis: testCase.expectedDiagnosis,
        actualTopDiagnosis,
        confidence,
        diagnosisInTop3,
        executionTime,
      });
      
      console.log(`  ✓ Completed in ${executionTime}ms`);
      console.log(`  Expected: ${testCase.expectedDiagnosis}`);
      console.log(`  Got: ${actualTopDiagnosis} (${(confidence * 100).toFixed(0)}%)`);
      console.log(`  Match: ${passed ? '✓' : diagnosisInTop3 ? '~' : '✗'}\n`);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      results.push({
        caseId: testCase.id,
        category: testCase.category,
        difficulty: testCase.difficulty,
        passed: false,
        expectedDiagnosis: testCase.expectedDiagnosis,
        actualTopDiagnosis: 'ERROR',
        confidence: 0,
        diagnosisInTop3: false,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    }
  }
  
  // Generate report
  const totalCases = results.length;
  const passedCases = results.filter(r => r.passed).length;
  const top3Accuracy = results.filter(r => r.diagnosisInTop3).length;
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalCases;
  
  const accuracyRate = ((passedCases / totalCases) * 100).toFixed(2);
  const top3Rate = ((top3Accuracy / totalCases) * 100).toFixed(2);
  
  console.log('\n' + '='.repeat(70));
  console.log('BRAIN SAMPLE TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Cases:           ${totalCases}`);
  console.log(`Top-1 Accuracy:        ${passedCases}/${totalCases} (${accuracyRate}%)`);
  console.log(`Top-3 Accuracy:        ${top3Accuracy}/${totalCases} (${top3Rate}%)`);
  console.log(`Avg Execution Time:    ${avgExecutionTime.toFixed(0)}ms`);
  console.log('='.repeat(70));
  
  // Category breakdown
  const categories = ['emergency', 'common', 'complex', 'pediatric', 'geriatric', 'iraqi-specific'];
  console.log('\nCategory Breakdown:');
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    const catTotal = catResults.length;
    if (catTotal > 0) {
      const catAccuracy = ((catPassed / catTotal) * 100).toFixed(0);
      console.log(`  ${cat}: ${catPassed}/${catTotal} (${catAccuracy}%)`);
    }
  }
  
  // Failed cases
  const failedCases = results.filter(r => !r.passed);
  if (failedCases.length > 0) {
    console.log('\nFailed Cases:');
    for (const failed of failedCases) {
      console.log(`  ${failed.caseId}: Expected "${failed.expectedDiagnosis}", Got "${failed.actualTopDiagnosis}"`);
      if (failed.error) {
        console.log(`    Error: ${failed.error}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Test complete! Full 100-case test suite available in brain-performance.test.ts');
  console.log('='.repeat(70) + '\n');
  
  return results;
}

export { runSampleTests };

// Run if executed directly
runSampleTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
