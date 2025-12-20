/**
 * BRAIN Baseline Performance Test (Simplified)
 * Tests BRAIN diagnostic accuracy using the API endpoint directly
 * Bypasses database caching issues for quick baseline measurement
 */

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
    'myocardialinfarction': ['mi', 'heartattack', 'stemi', 'nstemi', 'acutecoronarysyndrome', 'ami'],
    'stroke': ['cva', 'cerebrovascularaccident', 'ischemicstroke', 'acutestroke'],
    'appendicitis': ['acuteappendicitis'],
    'pneumonia': ['communityacquiredpneumonia', 'cap', 'bacterialpneumonia'],
    'asthma': ['asthmaexacerbation', 'acuteasthma', 'severeasthma'],
    'diabetesketoacidosis': ['dka', 'diabeticketoacidosis'],
    'pulmonaryembolism': ['pe', 'embolism'],
    'sepsis': ['septicshock', 'septicemia', 'urosepsis', 'severesepsis'],
    'subarachnoidhemorrhage': ['sah', 'subarachnoidbleed'],
    'gastroenteritis': ['acutegastroenteritis', 'viralg astroenteritis', 'foodpoisoning'],
  };
  
  for (const [key, syns] of Object.entries(synonyms)) {
    if ((actualNorm === key || syns.includes(actualNorm)) && 
        (expectedNorm === key || syns.includes(expectedNorm))) {
      return true;
    }
  }
  
  return false;
}

async function callBRAINAPI(testCase: any) {
  const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/trpc/brain.analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      symptoms: [testCase.chiefComplaint, testCase.symptoms],
      patientInfo: {
        age: testCase.patientAge,
        gender: testCase.patientGender,
        location: 'Iraq'
      },
      vitalSigns: testCase.vitals,
      language: 'en'
    })
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.result.data;
}

async function runBaselineTest() {
  console.log('🧠 BRAIN Baseline Performance Test (Simplified)\n');
  console.log('Testing 12 representative cases using BRAIN API...\n');
  
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
      const result = await callBRAINAPI(testCase);
      const executionTime = Date.now() - startTime;
      
      const topDiagnosis = result.diagnosis.differentialDiagnosis[0];
      const actualTopDiagnosis = topDiagnosis?.condition || 'Unknown';
      const confidence = topDiagnosis?.probability || 0;
      
      const top3Diagnoses = result.diagnosis.differentialDiagnosis.slice(0, 3).map((d: any) => d.condition);
      const diagnosisInTop3 = top3Diagnoses.some((d: string) => diagnosisMatches(d, testCase.expectedDiagnosis));
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
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
  
  const report = `
╔══════════════════════════════════════════════════════════════════╗
║           BRAIN BASELINE PERFORMANCE REPORT                      ║
╚══════════════════════════════════════════════════════════════════╝

📊 OVERALL METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Cases Tested:        ${totalCases}
  Top-1 Accuracy:            ${passedCases}/${totalCases} (${accuracyRate}%)
  Top-3 Accuracy:            ${top3Accuracy}/${totalCases} (${top3Rate}%)
  Avg Execution Time:        ${avgExecutionTime.toFixed(0)}ms

📁 CATEGORY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

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
  
  console.log('\n🎯 DIFFICULTY BREAKDOWN');
  console.log('━'.repeat(70));
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
    console.log('\n❌ FAILED CASES');
    console.log('━'.repeat(70));
    for (const failed of failedCases) {
      const inTop3 = failed.diagnosisInTop3 ? ' (but in top-3)' : '';
      console.log(`  ${failed.caseId}: Expected "${failed.expectedDiagnosis}", Got "${failed.actualTopDiagnosis}"${inTop3}`);
      if (failed.error) {
        console.log(`    Error: ${failed.error}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Baseline test complete! Top-1: ${accuracyRate}%, Top-3: ${top3Rate}%`);
  console.log('='.repeat(70) + '\n');
  
  // Save results to file
  const fs = require('fs');
  const resultsData = {
    timestamp: new Date().toISOString(),
    totalCases,
    passedCases,
    top3Accuracy,
    accuracyRate: parseFloat(accuracyRate),
    top3Rate: parseFloat(top3Rate),
    avgExecutionTime,
    results
  };
  fs.writeFileSync(
    '/home/ubuntu/meditriage-ai/brain-baseline-results.json',
    JSON.stringify(resultsData, null, 2)
  );
  console.log('📊 Results saved to brain-baseline-results.json\n');
  
  return results;
}

// Run if executed directly
runBaselineTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });

export { runBaselineTest };
