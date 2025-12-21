import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { labReports, labResults } from '../drizzle/schema.ts';
import { parseLabResults, interpretLabResult } from '../server/lab-ocr.ts';
import { storagePut } from '../server/storage.ts';
import fs from 'fs/promises';
import path from 'path';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🧪 Testing Lab Result Interpretation System...\n');

try {
  // Step 1: Read sample lab report
  console.log('📄 Step 1: Reading sample lab report...');
  const reportPath = path.join(process.cwd(), 'test-data', 'sample-lab-report.txt');
  const reportText = await fs.readFile(reportPath, 'utf-8');
  console.log(`✅ Read ${reportText.length} characters from sample report\n`);

  // Step 2: Upload to S3
  console.log('☁️  Step 2: Uploading to S3...');
  const fileKey = `lab-reports/test-${Date.now()}.txt`;
  const { url: fileUrl } = await storagePut(fileKey, reportText, 'text/plain');
  console.log(`✅ Uploaded to: ${fileUrl}\n`);

  // Step 3: Create lab report record
  console.log('💾 Step 3: Creating lab report record...');
  const [report] = await db.insert(labReports).values({
    userId: 1, // Admin user for testing
    reportDate: new Date('2024-12-21'),
    reportName: 'sample-lab-report.txt',
    fileUrl: fileUrl,
    fileType: 'text/plain',
    fileSize: reportText.length,
    status: 'processing',
    uploadDate: new Date(),
  }).$returningId();
  
  const reportId = report.id;
  console.log(`✅ Created lab report with ID: ${reportId}\n`);

  // Step 4: Parse lab results
  console.log('🤖 Step 4: AI parsing lab results...');
  console.log('   This will take 10-15 seconds...');
  
  const parsedResults = await parseLabResults(reportText, new Date());
  console.log(`✅ Parsed ${parsedResults.length} test results\n`);

  // Step 5: Interpret first 3 abnormal results (to save time)
  console.log('🧠 Step 5: Interpreting abnormal results...');
  const abnormalResults = parsedResults.filter(r => r.abnormalFlag).slice(0, 3);
  console.log(`   Interpreting ${abnormalResults.length} abnormal results...`);
  
  const interpretedResults = [];
  for (const result of abnormalResults) {
    const interpretation = await interpretLabResult(result);
    interpretedResults.push({
      ...result,
      ...interpretation
    });
  }
  console.log(`✅ Interpreted ${interpretedResults.length} results\n`);

  // Step 6: Save results to database
  console.log('💾 Step 6: Saving results to database...');
  
  const resultsToInsert = parsedResults.map(result => ({
    reportId: reportId,
    userId: 1,
    testName: result.testName,
    testCode: result.testCode || null,
    testCategory: result.testCategory || null,
    value: result.value,
    numericValue: result.numericValue || null,
    unit: result.unit || null,
    referenceRangeMin: result.referenceRangeMin || null,
    referenceRangeMax: result.referenceRangeMax || null,
    referenceRangeText: result.referenceRangeText || null,
    status: result.status,
    abnormalFlag: result.abnormalFlag,
    criticalFlag: result.criticalFlag,
    interpretation: null, // Will be filled for abnormal results
    clinicalSignificance: null,
    possibleCauses: null,
    recommendedFollowUp: null,
    testDate: new Date('2024-12-21'),
  }));

  await db.insert(labResults).values(resultsToInsert);
  console.log(`✅ Saved ${resultsToInsert.length} test results\n`);

  // Step 7: Update report status
  console.log('✅ Step 7: Updating report status to completed...');
  await db.update(labReports)
    .set({ 
      status: 'completed',
      processedAt: new Date(),
      extractedText: reportText.substring(0, 5000), // Store first 5000 chars
    })
    .where({ id: reportId });
  console.log(`✅ Report status updated\n`);

  // Step 8: Display summary
  console.log('📊 ========== TEST RESULTS SUMMARY ==========\n');
  console.log(`Report ID: ${reportId}`);
  console.log(`Patient: Ahmed Hassan (39 years, Male)`);
  console.log(`Total Tests: ${parsedResults.length}`);
  
  const abnormalCount = parsedResults.filter(r => r.abnormalFlag).length;
  const criticalCount = parsedResults.filter(r => r.criticalFlag).length;
  console.log(`Abnormal Results: ${abnormalCount}`);
  console.log(`Critical Results: ${criticalCount}\n`);

  console.log('🔴 Sample Abnormal Results with Interpretations:');
  interpretedResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.testName}: ${result.value} ${result.unit || ''}`);
    console.log(`   Reference: ${result.referenceRangeText || `${result.referenceRangeMin}-${result.referenceRangeMax}`}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Interpretation: ${result.interpretation.substring(0, 150)}...`);
    console.log(`   Clinical Significance: ${result.clinicalSignificance.substring(0, 150)}...`);
    if (result.possibleCauses.length > 0) {
      console.log(`   Possible Causes: ${result.possibleCauses.slice(0, 2).join(', ')}`);
    }
  });

  console.log('\n\n✨ ========== TEST COMPLETED SUCCESSFULLY ==========');
  console.log('\n📋 Next Steps:');
  console.log('1. Visit the Lab Results page in the clinician dashboard');
  console.log('2. You should see the uploaded report');
  console.log('3. Click on the report to view detailed results');
  console.log('4. Try uploading your own lab report PDF/image\n');

} catch (error) {
  console.error('❌ Error during test:', error);
  console.error(error.stack);
  process.exit(1);
} finally {
  await connection.end();
}
