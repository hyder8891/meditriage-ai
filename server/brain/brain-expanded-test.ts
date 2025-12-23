// @ts-nocheck
/**
 * BRAIN Expanded Performance Test
 * Tests 24 cases (4 from each category) for comprehensive baseline
 */

import { brain } from './index';
import { testCases } from './test-cases';
import * as fs from 'fs';

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

// Helper function to check if diagnosis matches (fuzzy matching with expanded synonyms)
function diagnosisMatches(actual: string, expected: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const actualNorm = normalize(actual);
  const expectedNorm = normalize(expected);
  
  if (actualNorm === expectedNorm) return true;
  if (actualNorm.includes(expectedNorm) || expectedNorm.includes(actualNorm)) return true;
  
  const synonyms: Record<string, string[]> = {
    // Cardiac conditions
    'myocardialinfarction': ['mi', 'heartattack', 'stemi', 'nstemi', 'acutecoronarysyndrome', 'acs', 'ami', 'stelevationmyocardialinfarction'],
    'acutemyocardialinfarction': ['mi', 'heartattack', 'stemi', 'nstemi', 'acutecoronarysyndrome', 'acs', 'ami'],
    
    // Neurological conditions
    'stroke': ['cva', 'cerebrovascularaccident', 'ischemicstroke', 'acutestroke'],
    'subarachnoidhemorrhage': ['sah', 'subarachnoidbleed'],
    'multiplesclerosis': ['ms'],
    'normalpressurehydrocephalus': ['nph'],
    
    // Respiratory conditions
    'pneumonia': ['communityacquiredpneumonia', 'cap', 'bacterialpneumonia'],
    'asthma': ['asthmaexacerbation', 'acuteasthma', 'severeasthma'],
    'bronchiolitis': ['acutebronchiolitis', 'viralbronchiolitis', 'rsvbronchiolitis'],
    'pulmonarytuberculosis': ['ptb', 'tuberculosis', 'tb', 'pulmonarytb'],
    
    // GI conditions
    'gastroenteritis': ['acutegastroenteritis', 'bacterialgastroenteritis', 'acutebacterialgastroenteritis'],
    'acutegastroenteritis': ['gastroenteritis', 'bacterialgastroenteritis'],
    'appendicitis': ['acuteappendicitis'],
    
    // Musculoskeletal conditions
    'hipfracture': ['femoralneckfracture', 'intertrochantericfracture', 'subcapitalfracture', 'femoralfracture'],
    'femoralneckfracture': ['hipfracture', 'intertrochantericfracture', 'subcapitalfracture'],
    
    // Infectious diseases
    'brucellosis': ['maltafever', 'undulatfever'],
    'scarletfever': ['scarlatina'],
    
    // Hematologic/Oncologic
    'lymphoma': ['hodgkinslymphoma', 'nonhodgkinslymphoma', 'hodgkins', 'nhl'],
  };
  
  for (const [key, syns] of Object.entries(synonyms)) {
    if ((actualNorm === key || syns.includes(actualNorm)) && 
        (expectedNorm === key || syns.includes(expectedNorm))) {
      return true;
    }
  }
  
  return false;
}

async function runExpandedTests() {
  console.log('🧠 BRAIN Expanded Performance Test (24 cases)\n');
  console.log('Testing 4 cases from each category...\n');
  
  // Select 4 cases from each category
  const expandedCases = [
    // Emergency (4 cases)
    testCases[0],  // EMG-001: Acute MI
    testCases[3],  // EMG-004: Acute Appendicitis
    testCases[5],  // EMG-006: Subarachnoid Hemorrhage
    testCases[8],  // EMG-009: Severe Preeclampsia
    
    // Common (4 cases)
    testCases[20], // COM-001: Pneumonia
    testCases[22], // COM-003: GERD
    testCases[25], // COM-006: Gastroenteritis
    testCases[28], // COM-009: Hypertension
    
    // Complex (4 cases)
    testCases[50], // CPX-001: Lymphoma
    testCases[52], // CPX-003: Hepatic Encephalopathy
    testCases[55], // CPX-006: Multiple Sclerosis
    testCases[58], // CPX-009: Acromegaly
    
    // Pediatric (4 cases)
    testCases[70], // PED-001: Bronchiolitis
    testCases[72], // PED-003: Croup
    testCases[75], // PED-006: Scarlet Fever
    testCases[77], // PED-008: Dehydration
    
    // Geriatric (4 cases)
    testCases[80], // GER-001: Hip Fracture
    testCases[82], // GER-003: Orthostatic Hypotension
    testCases[85], // GER-006: Normal Pressure Hydrocephalus
    testCases[87], // GER-008: Atypical MI
    
    // Iraqi-Specific (4 cases)
    testCases[90], // IRQ-001: Brucellosis
    testCases[92], // IRQ-003: Typhoid Fever
    testCases[95], // IRQ-006: Tuberculosis
    testCases[97], // IRQ-008: Schistosomiasis
  ];
  
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  for (let i = 0; i < expandedCases.length; i++) {
    const testCase = expandedCases[i];
    console.log(`[${i + 1}/24] Testing ${testCase.id}: ${testCase.chiefComplaint}...`);
    const caseStartTime = Date.now();
    
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
      
      const executionTime = Date.now() - caseStartTime;
      
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
      console.log(`  Match: ${passed ? '✓ PASS' : diagnosisInTop3 ? '~ TOP-3' : '✗ FAIL'}\n`);
      
    } catch (error) {
      const executionTime = Date.now() - caseStartTime;
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
  
  const totalTime = Date.now() - startTime;
  
  // Generate report
  const totalCases = results.length;
  const passedCases = results.filter(r => r.passed).length;
  const top3Accuracy = results.filter(r => r.diagnosisInTop3).length;
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalCases;
  
  const accuracyRate = ((passedCases / totalCases) * 100).toFixed(2);
  const top3Rate = ((top3Accuracy / totalCases) * 100).toFixed(2);
  
  console.log('='.repeat(70));
  console.log('BRAIN EXPANDED TEST RESULTS (24 CASES)');
  console.log('='.repeat(70));
  console.log(`Total Cases:           ${totalCases}`);
  console.log(`Top-1 Accuracy:        ${passedCases}/${totalCases} (${accuracyRate}%)`);
  console.log(`Top-3 Accuracy:        ${top3Accuracy}/${totalCases} (${top3Rate}%)`);
  console.log(`Avg Execution Time:    ${avgExecutionTime.toFixed(0)}ms`);
  console.log(`Total Test Time:       ${(totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log('='.repeat(70));
  
  // Category breakdown
  console.log('\nCategory Breakdown:');
  const categories = ['emergency', 'common', 'complex', 'pediatric', 'geriatric', 'iraqi-specific'];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    const catTop3 = catResults.filter(r => r.diagnosisInTop3).length;
    const catTotal = catResults.length;
    if (catTotal > 0) {
      const catAccuracy = ((catPassed / catTotal) * 100).toFixed(0);
      const catTop3Acc = ((catTop3 / catTotal) * 100).toFixed(0);
      console.log(`  ${cat}: ${catPassed}/${catTotal} top-1 (${catAccuracy}%), ${catTop3}/${catTotal} top-3 (${catTop3Acc}%)`);
    }
  }
  
  // Difficulty breakdown
  console.log('\nDifficulty Breakdown:');
  const difficulties = ['easy', 'medium', 'hard'];
  for (const diff of difficulties) {
    const diffResults = results.filter(r => r.difficulty === diff);
    const diffPassed = diffResults.filter(r => r.passed).length;
    const diffTop3 = diffResults.filter(r => r.diagnosisInTop3).length;
    const diffTotal = diffResults.length;
    if (diffTotal > 0) {
      const diffAccuracy = ((diffPassed / diffTotal) * 100).toFixed(0);
      const diffTop3Acc = ((diffTop3 / diffTotal) * 100).toFixed(0);
      console.log(`  ${diff}: ${diffPassed}/${diffTotal} top-1 (${diffAccuracy}%), ${diffTop3}/${diffTotal} top-3 (${diffTop3Acc}%)`);
    }
  }
  
  // Failed cases
  const failedCases = results.filter(r => !r.passed);
  if (failedCases.length > 0) {
    console.log('\nFailed Cases:');
    for (const failed of failedCases) {
      const inTop3 = failed.diagnosisInTop3 ? ' (but in top-3)' : '';
      console.log(`  ${failed.caseId}: Expected "${failed.expectedDiagnosis}", Got "${failed.actualTopDiagnosis}"${inTop3}`);
      if (failed.error) {
        console.log(`    Error: ${failed.error}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Expanded test complete! Top-1: ${accuracyRate}%, Top-3: ${top3Rate}%`);
  console.log('='.repeat(70) + '\n');
  
  // Save comprehensive results to single file
  const resultsData = {
    testInfo: {
      timestamp: new Date().toISOString(),
      testType: 'expanded',
      totalCases,
      categories: 6,
      casesPerCategory: 4,
      totalTestTimeMinutes: parseFloat((totalTime / 1000 / 60).toFixed(1))
    },
    summary: {
      passedCases,
      top3Accuracy,
      accuracyRate: parseFloat(accuracyRate),
      top3Rate: parseFloat(top3Rate),
      avgExecutionTime: parseFloat(avgExecutionTime.toFixed(0))
    },
    categoryBreakdown: categories.map(cat => {
      const catResults = results.filter(r => r.category === cat);
      const catPassed = catResults.filter(r => r.passed).length;
      const catTop3 = catResults.filter(r => r.diagnosisInTop3).length;
      return {
        category: cat,
        total: catResults.length,
        passed: catPassed,
        top3: catTop3,
        accuracy: parseFloat(((catPassed / catResults.length) * 100).toFixed(1)),
        top3Accuracy: parseFloat(((catTop3 / catResults.length) * 100).toFixed(1))
      };
    }),
    difficultyBreakdown: difficulties.map(diff => {
      const diffResults = results.filter(r => r.difficulty === diff);
      const diffPassed = diffResults.filter(r => r.passed).length;
      const diffTop3 = diffResults.filter(r => r.diagnosisInTop3).length;
      return {
        difficulty: diff,
        total: diffResults.length,
        passed: diffPassed,
        top3: diffTop3,
        accuracy: parseFloat(((diffPassed / diffResults.length) * 100).toFixed(1)),
        top3Accuracy: parseFloat(((diffTop3 / diffResults.length) * 100).toFixed(1))
      };
    }),
    detailedResults: results
  };
  
  fs.writeFileSync(
    '/home/ubuntu/meditriage-ai/brain-expanded-test-results.json',
    JSON.stringify(resultsData, null, 2)
  );
  console.log('📊 All results saved to brain-expanded-test-results.json\n');
  console.log('💡 To delete test data: rm /home/ubuntu/meditriage-ai/brain-expanded-test-results.json\n');
  
  return results;
}

// Run if executed directly
runExpandedTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });

export { runExpandedTests };
