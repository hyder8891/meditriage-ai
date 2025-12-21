import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { labReferenceRanges } from '../drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const referenceRanges = [
  // Complete Blood Count (CBC)
  {
    testName: 'Hemoglobin',
    testCategory: 'CBC',
    unit: 'g/dL',
    minValue: 13.5,
    maxValue: 17.5,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: 7.0,
    criticalHigh: 20.0,
    notes: 'Normal hemoglobin levels for adult males'
  },
  {
    testName: 'Hemoglobin',
    testCategory: 'CBC',
    unit: 'g/dL',
    minValue: 12.0,
    maxValue: 15.5,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: 7.0,
    criticalHigh: 20.0,
    notes: 'Normal hemoglobin levels for adult females'
  },
  {
    testName: 'White Blood Cells (WBC)',
    testCategory: 'CBC',
    unit: '10^3/µL',
    minValue: 4.5,
    maxValue: 11.0,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 2.0,
    criticalHigh: 30.0,
    notes: 'Normal WBC count for adults'
  },
  {
    testName: 'Platelets',
    testCategory: 'CBC',
    unit: '10^3/µL',
    minValue: 150,
    maxValue: 400,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 50,
    criticalHigh: 1000,
    notes: 'Normal platelet count'
  },
  {
    testName: 'Red Blood Cells (RBC)',
    testCategory: 'CBC',
    unit: '10^6/µL',
    minValue: 4.5,
    maxValue: 5.9,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: 2.5,
    criticalHigh: 7.0,
    notes: 'Normal RBC count for adult males'
  },
  {
    testName: 'Red Blood Cells (RBC)',
    testCategory: 'CBC',
    unit: '10^6/µL',
    minValue: 4.0,
    maxValue: 5.2,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: 2.5,
    criticalHigh: 7.0,
    notes: 'Normal RBC count for adult females'
  },
  {
    testName: 'Hematocrit',
    testCategory: 'CBC',
    unit: '%',
    minValue: 38.8,
    maxValue: 50.0,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: 20.0,
    criticalHigh: 60.0,
    notes: 'Normal hematocrit for adult males'
  },
  {
    testName: 'Hematocrit',
    testCategory: 'CBC',
    unit: '%',
    minValue: 34.9,
    maxValue: 44.5,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: 20.0,
    criticalHigh: 60.0,
    notes: 'Normal hematocrit for adult females'
  },
  {
    testName: 'MCV (Mean Corpuscular Volume)',
    testCategory: 'CBC',
    unit: 'fL',
    minValue: 80,
    maxValue: 100,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 60,
    criticalHigh: 120,
    notes: 'Normal red blood cell size'
  },
  {
    testName: 'MCH (Mean Corpuscular Hemoglobin)',
    testCategory: 'CBC',
    unit: 'pg',
    minValue: 27,
    maxValue: 33,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 20,
    criticalHigh: 40,
    notes: 'Normal hemoglobin per red blood cell'
  },
  {
    testName: 'MCHC (Mean Corpuscular Hemoglobin Concentration)',
    testCategory: 'CBC',
    unit: 'g/dL',
    minValue: 32,
    maxValue: 36,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 28,
    criticalHigh: 40,
    notes: 'Normal hemoglobin concentration'
  },

  // Basic Metabolic Panel (BMP)
  {
    testName: 'Glucose',
    testCategory: 'BMP',
    unit: 'mg/dL',
    minValue: 70,
    maxValue: 100,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 40,
    criticalHigh: 400,
    notes: 'Fasting glucose level'
  },
  {
    testName: 'Sodium',
    testCategory: 'BMP',
    unit: 'mEq/L',
    minValue: 136,
    maxValue: 145,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 120,
    criticalHigh: 160,
    notes: 'Normal serum sodium'
  },
  {
    testName: 'Potassium',
    testCategory: 'BMP',
    unit: 'mEq/L',
    minValue: 3.5,
    maxValue: 5.0,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 2.5,
    criticalHigh: 6.5,
    notes: 'Normal serum potassium'
  },
  {
    testName: 'Chloride',
    testCategory: 'BMP',
    unit: 'mEq/L',
    minValue: 98,
    maxValue: 107,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 80,
    criticalHigh: 120,
    notes: 'Normal serum chloride'
  },
  {
    testName: 'CO2 (Bicarbonate)',
    testCategory: 'BMP',
    unit: 'mEq/L',
    minValue: 23,
    maxValue: 29,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 15,
    criticalHigh: 40,
    notes: 'Normal bicarbonate level'
  },
  {
    testName: 'BUN (Blood Urea Nitrogen)',
    testCategory: 'BMP',
    unit: 'mg/dL',
    minValue: 7,
    maxValue: 20,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 2,
    criticalHigh: 100,
    notes: 'Normal kidney function marker'
  },
  {
    testName: 'Creatinine',
    testCategory: 'BMP',
    unit: 'mg/dL',
    minValue: 0.7,
    maxValue: 1.3,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: 0.3,
    criticalHigh: 10.0,
    notes: 'Normal creatinine for adult males'
  },
  {
    testName: 'Creatinine',
    testCategory: 'BMP',
    unit: 'mg/dL',
    minValue: 0.6,
    maxValue: 1.1,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: 0.3,
    criticalHigh: 10.0,
    notes: 'Normal creatinine for adult females'
  },
  {
    testName: 'Calcium',
    testCategory: 'BMP',
    unit: 'mg/dL',
    minValue: 8.5,
    maxValue: 10.5,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 6.0,
    criticalHigh: 13.0,
    notes: 'Normal serum calcium'
  },

  // Lipid Panel
  {
    testName: 'Total Cholesterol',
    testCategory: 'Lipid Panel',
    unit: 'mg/dL',
    minValue: 0,
    maxValue: 200,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 300,
    notes: 'Desirable cholesterol level'
  },
  {
    testName: 'LDL Cholesterol',
    testCategory: 'Lipid Panel',
    unit: 'mg/dL',
    minValue: 0,
    maxValue: 100,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 250,
    notes: 'Optimal LDL (bad cholesterol)'
  },
  {
    testName: 'HDL Cholesterol',
    testCategory: 'Lipid Panel',
    unit: 'mg/dL',
    minValue: 40,
    maxValue: 200,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: 20,
    criticalHigh: null,
    notes: 'Protective HDL (good cholesterol) for males'
  },
  {
    testName: 'HDL Cholesterol',
    testCategory: 'Lipid Panel',
    unit: 'mg/dL',
    minValue: 50,
    maxValue: 200,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: 20,
    criticalHigh: null,
    notes: 'Protective HDL (good cholesterol) for females'
  },
  {
    testName: 'Triglycerides',
    testCategory: 'Lipid Panel',
    unit: 'mg/dL',
    minValue: 0,
    maxValue: 150,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 500,
    notes: 'Normal triglyceride level'
  },

  // Liver Function Tests (LFT)
  {
    testName: 'ALT (Alanine Aminotransferase)',
    testCategory: 'LFT',
    unit: 'U/L',
    minValue: 7,
    maxValue: 56,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 1000,
    notes: 'Liver enzyme marker'
  },
  {
    testName: 'AST (Aspartate Aminotransferase)',
    testCategory: 'LFT',
    unit: 'U/L',
    minValue: 10,
    maxValue: 40,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 1000,
    notes: 'Liver and heart enzyme marker'
  },
  {
    testName: 'ALP (Alkaline Phosphatase)',
    testCategory: 'LFT',
    unit: 'U/L',
    minValue: 44,
    maxValue: 147,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 500,
    notes: 'Liver and bone enzyme'
  },
  {
    testName: 'Total Bilirubin',
    testCategory: 'LFT',
    unit: 'mg/dL',
    minValue: 0.1,
    maxValue: 1.2,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 15.0,
    notes: 'Liver function and hemolysis marker'
  },
  {
    testName: 'Direct Bilirubin',
    testCategory: 'LFT',
    unit: 'mg/dL',
    minValue: 0.0,
    maxValue: 0.3,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 10.0,
    notes: 'Conjugated bilirubin'
  },
  {
    testName: 'Albumin',
    testCategory: 'LFT',
    unit: 'g/dL',
    minValue: 3.5,
    maxValue: 5.5,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 2.0,
    criticalHigh: 6.0,
    notes: 'Protein synthesized by liver'
  },
  {
    testName: 'Total Protein',
    testCategory: 'LFT',
    unit: 'g/dL',
    minValue: 6.0,
    maxValue: 8.3,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 4.0,
    criticalHigh: 10.0,
    notes: 'Total serum protein'
  },

  // Thyroid Function Tests
  {
    testName: 'TSH (Thyroid Stimulating Hormone)',
    testCategory: 'Thyroid Panel',
    unit: 'mIU/L',
    minValue: 0.4,
    maxValue: 4.0,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 0.01,
    criticalHigh: 20.0,
    notes: 'Primary thyroid function test'
  },
  {
    testName: 'Free T4 (Thyroxine)',
    testCategory: 'Thyroid Panel',
    unit: 'ng/dL',
    minValue: 0.8,
    maxValue: 1.8,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 0.2,
    criticalHigh: 5.0,
    notes: 'Free thyroid hormone'
  },
  {
    testName: 'Free T3 (Triiodothyronine)',
    testCategory: 'Thyroid Panel',
    unit: 'pg/mL',
    minValue: 2.3,
    maxValue: 4.2,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 1.0,
    criticalHigh: 10.0,
    notes: 'Active thyroid hormone'
  },

  // Hemoglobin A1C (Diabetes)
  {
    testName: 'Hemoglobin A1C',
    testCategory: 'Diabetes',
    unit: '%',
    minValue: 4.0,
    maxValue: 5.6,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 14.0,
    notes: 'Normal A1C, no diabetes'
  },

  // Vitamin D
  {
    testName: 'Vitamin D (25-OH)',
    testCategory: 'Vitamins',
    unit: 'ng/mL',
    minValue: 30,
    maxValue: 100,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 10,
    criticalHigh: 150,
    notes: 'Optimal vitamin D level'
  },

  // Iron Studies
  {
    testName: 'Iron',
    testCategory: 'Iron Studies',
    unit: 'µg/dL',
    minValue: 60,
    maxValue: 170,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: 20,
    criticalHigh: 300,
    notes: 'Normal serum iron for males'
  },
  {
    testName: 'Iron',
    testCategory: 'Iron Studies',
    unit: 'µg/dL',
    minValue: 50,
    maxValue: 150,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: 20,
    criticalHigh: 300,
    notes: 'Normal serum iron for females'
  },
  {
    testName: 'Ferritin',
    testCategory: 'Iron Studies',
    unit: 'ng/mL',
    minValue: 20,
    maxValue: 300,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: 5,
    criticalHigh: 1000,
    notes: 'Iron storage protein for males'
  },
  {
    testName: 'Ferritin',
    testCategory: 'Iron Studies',
    unit: 'ng/mL',
    minValue: 15,
    maxValue: 200,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: 5,
    criticalHigh: 1000,
    notes: 'Iron storage protein for females'
  },
  {
    testName: 'TIBC (Total Iron Binding Capacity)',
    testCategory: 'Iron Studies',
    unit: 'µg/dL',
    minValue: 250,
    maxValue: 450,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: 150,
    criticalHigh: 600,
    notes: 'Transferrin saturation capacity'
  },

  // Coagulation Studies
  {
    testName: 'PT (Prothrombin Time)',
    testCategory: 'Coagulation',
    unit: 'seconds',
    minValue: 11,
    maxValue: 13.5,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 30,
    notes: 'Clotting time measurement'
  },
  {
    testName: 'INR (International Normalized Ratio)',
    testCategory: 'Coagulation',
    unit: 'ratio',
    minValue: 0.8,
    maxValue: 1.2,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 5.0,
    notes: 'Standardized PT ratio'
  },
  {
    testName: 'aPTT (Activated Partial Thromboplastin Time)',
    testCategory: 'Coagulation',
    unit: 'seconds',
    minValue: 25,
    maxValue: 35,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 100,
    notes: 'Intrinsic clotting pathway'
  },

  // Cardiac Markers
  {
    testName: 'Troponin I',
    testCategory: 'Cardiac Markers',
    unit: 'ng/mL',
    minValue: 0.0,
    maxValue: 0.04,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 10.0,
    notes: 'Cardiac muscle damage marker'
  },
  {
    testName: 'CK-MB (Creatine Kinase-MB)',
    testCategory: 'Cardiac Markers',
    unit: 'ng/mL',
    minValue: 0.0,
    maxValue: 5.0,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 25.0,
    notes: 'Heart-specific enzyme'
  },
  {
    testName: 'BNP (B-type Natriuretic Peptide)',
    testCategory: 'Cardiac Markers',
    unit: 'pg/mL',
    minValue: 0,
    maxValue: 100,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 2000,
    notes: 'Heart failure marker'
  },

  // Inflammatory Markers
  {
    testName: 'CRP (C-Reactive Protein)',
    testCategory: 'Inflammatory Markers',
    unit: 'mg/L',
    minValue: 0.0,
    maxValue: 3.0,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 200,
    notes: 'General inflammation marker'
  },
  {
    testName: 'ESR (Erythrocyte Sedimentation Rate)',
    testCategory: 'Inflammatory Markers',
    unit: 'mm/hr',
    minValue: 0,
    maxValue: 15,
    ageGroup: 'adult',
    gender: 'male',
    criticalLow: null,
    criticalHigh: 100,
    notes: 'Inflammation marker for males'
  },
  {
    testName: 'ESR (Erythrocyte Sedimentation Rate)',
    testCategory: 'Inflammatory Markers',
    unit: 'mm/hr',
    minValue: 0,
    maxValue: 20,
    ageGroup: 'adult',
    gender: 'female',
    criticalLow: null,
    criticalHigh: 100,
    notes: 'Inflammation marker for females'
  },

  // Urinalysis
  {
    testName: 'Urine Protein',
    testCategory: 'Urinalysis',
    unit: 'mg/dL',
    minValue: 0,
    maxValue: 10,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 500,
    notes: 'Normal urine protein'
  },
  {
    testName: 'Urine Glucose',
    testCategory: 'Urinalysis',
    unit: 'mg/dL',
    minValue: 0,
    maxValue: 15,
    ageGroup: 'adult',
    gender: 'both',
    criticalLow: null,
    criticalHigh: 1000,
    notes: 'Normal urine glucose'
  },
];

console.log('🔬 Seeding lab reference ranges...');
console.log(`📊 Total ranges to insert: ${referenceRanges.length}`);

try {
  // Insert all reference ranges
  await db.insert(labReferenceRanges).values(referenceRanges);
  
  console.log('✅ Successfully seeded lab reference ranges!');
  console.log('\n📋 Categories seeded:');
  console.log('  - Complete Blood Count (CBC): 11 tests');
  console.log('  - Basic Metabolic Panel (BMP): 9 tests');
  console.log('  - Lipid Panel: 5 tests');
  console.log('  - Liver Function Tests (LFT): 7 tests');
  console.log('  - Thyroid Panel: 3 tests');
  console.log('  - Diabetes: 1 test');
  console.log('  - Vitamins: 1 test');
  console.log('  - Iron Studies: 5 tests');
  console.log('  - Coagulation: 3 tests');
  console.log('  - Cardiac Markers: 3 tests');
  console.log('  - Inflammatory Markers: 3 tests');
  console.log('  - Urinalysis: 2 tests');
  console.log(`\n✨ Total: ${referenceRanges.length} reference ranges`);
} catch (error) {
  console.error('❌ Error seeding reference ranges:', error);
  process.exit(1);
} finally {
  await connection.end();
}
