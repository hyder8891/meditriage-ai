# BRAIN Performance Testing Suite

## Overview

This document describes the comprehensive performance testing suite created for the BRAIN (Biomedical Reasoning and Intelligence Network) diagnostic system. The test suite validates diagnostic accuracy across 100 carefully curated clinical case scenarios.

## Test Structure

### Test Case Categories (100 Total)

1. **Emergency Cases (20)** - Life-threatening conditions requiring immediate recognition
   - Acute Myocardial Infarction
   - Acute Ischemic Stroke
   - Severe Asthma Exacerbation
   - Acute Appendicitis
   - Diabetic Ketoacidosis
   - Subarachnoid Hemorrhage
   - Pulmonary Embolism
   - Bowel Obstruction
   - Severe Preeclampsia
   - Septic Shock
   - Anaphylaxis
   - Aortic Dissection
   - Ruptured Ectopic Pregnancy
   - Esophageal Variceal Bleeding
   - Testicular Torsion
   - Central Retinal Artery Occlusion
   - Bacterial Meningitis (Pediatric)
   - Acute Angle-Closure Glaucoma
   - Pneumothorax (Trauma)
   - Ruptured Abdominal Aortic Aneurysm

2. **Common Conditions (30)** - Frequently encountered diagnoses in primary care
   - Community-Acquired Pneumonia
   - Urinary Tract Infection
   - Gastroesophageal Reflux Disease
   - Type 2 Diabetes Mellitus
   - Migraine
   - Acute Gastroenteritis
   - Rheumatoid Arthritis
   - Streptococcal Pharyngitis
   - Essential Hypertension
   - Hypothyroidism
   - Acute Lumbar Strain
   - Panic Disorder
   - Vaginal Candidiasis
   - Benign Prostatic Hyperplasia
   - Acute Bacterial Sinusitis
   - Stable Angina
   - Contact Dermatitis
   - Menopause
   - Plantar Fasciitis
   - Congestive Heart Failure
   - Acne Vulgaris
   - Alzheimer's Disease
   - Tinea Pedis
   - Major Depressive Disorder
   - Bacterial Conjunctivitis
   - Acute Gout
   - Primary Dysmenorrhea
   - Sjögren's Syndrome
   - External Hemorrhoids
   - Carpal Tunnel Syndrome

3. **Complex Cases (20)** - Multi-system involvement or atypical presentations
   - Lymphoma
   - Systemic Lupus Erythematosus
   - Hepatic Encephalopathy
   - Myasthenia Gravis
   - Lung Cancer
   - Multiple Sclerosis
   - Ulcerative Colitis
   - Nephrotic Syndrome
   - Acromegaly
   - Antiphospholipid Syndrome
   - Guillain-Barré Syndrome
   - Addison's Disease
   - Parkinson's Disease
   - Endometriosis
   - Pancreatic Cancer
   - Pheochromocytoma
   - Multiple Myeloma
   - Polymyositis
   - Hodgkin Lymphoma
   - Severe Hypothyroidism

4. **Pediatric Cases (10)** - Age-specific presentations
   - Bronchiolitis
   - Acute Otitis Media
   - Croup
   - Measles
   - Intussusception
   - Scarlet Fever
   - Kawasaki Disease
   - Severe Dehydration from Gastroenteritis
   - Chickenpox
   - Mumps

5. **Geriatric Cases (10)** - Elderly-specific considerations
   - Hip Fracture
   - Urosepsis
   - Orthostatic Hypotension
   - Acute Decompensated Heart Failure
   - Upper GI Bleeding from NSAID Use
   - Normal Pressure Hydrocephalus
   - Vertebral Compression Fracture
   - Atypical Myocardial Infarction
   - Esophageal Cancer
   - Acute Urinary Retention

6. **Iraqi-Specific Cases (10)** - Tropical diseases and local prevalence conditions
   - Brucellosis
   - Cutaneous Leishmaniasis
   - Typhoid Fever
   - Hydatid Cyst Disease
   - Dengue Fever
   - Pulmonary Tuberculosis
   - Malaria
   - Hepatic Schistosomiasis
   - Cholera
   - Intestinal Schistosomiasis

## Test Difficulty Levels

- **Easy (23 cases)**: Clear presentations with typical symptoms
- **Medium (39 cases)**: Some atypical features or overlapping symptoms
- **Hard (38 cases)**: Complex presentations, rare conditions, or multiple confounders

## Test Metrics

### Primary Metrics

1. **Top-1 Accuracy**: Percentage of cases where the expected diagnosis matches the top-ranked BRAIN diagnosis
   - Target: ≥85%

2. **Top-3 Accuracy**: Percentage of cases where the expected diagnosis appears in the top 3 BRAIN diagnoses
   - Target: ≥95%

3. **Urgency Accuracy**: Percentage of cases where BRAIN correctly identifies emergency vs. non-emergency cases
   - Target: ≥90%

4. **Average Execution Time**: Mean time to generate diagnosis across all cases
   - Target: <3000ms per case

### Secondary Metrics

- Category-specific accuracy rates
- Difficulty-level performance breakdown
- Confidence score calibration
- Red flag detection rate for emergency cases

## Test Files

### Core Test Files

1. **`server/brain/test-cases.ts`**
   - Contains all 100 clinical case scenarios
   - Each case includes:
     - Patient demographics (age, gender)
     - Chief complaint
     - Detailed symptoms
     - Vital signs
     - Expected diagnosis
     - Expected urgency level
     - Expected confidence score
     - Alternative diagnoses
     - Red flags

2. **`server/brain/brain-performance.test.ts`**
   - Comprehensive vitest test suite
   - Tests all 100 cases organized by category
   - Generates detailed performance report
   - Includes fuzzy diagnosis matching with synonym support
   - Exports results for external analysis

3. **`server/brain/brain-sample-test.ts`**
   - Quick validation with 12 representative cases (2 from each category)
   - Faster execution for rapid iteration
   - Suitable for CI/CD pipelines

## Running the Tests

### Full Test Suite (100 cases)

```bash
cd /home/ubuntu/meditriage-ai
pnpm test server/brain/brain-performance.test.ts --run
```

**Note**: Full suite takes 30-60 minutes due to LLM API calls for each case.

### Sample Test (12 cases)

```bash
cd /home/ubuntu/meditriage-ai
npx tsx server/brain/brain-sample-test.ts
```

**Note**: Sample test takes 3-5 minutes.

## Test Case Structure

Each test case follows this structure:

```typescript
{
  id: 'EMG-001',
  category: 'emergency',
  difficulty: 'easy',
  patientAge: 55,
  patientGender: 'male',
  chiefComplaint: 'Severe crushing chest pain',
  symptoms: 'Crushing chest pain radiating to left arm and jaw, started 30 minutes ago, associated with sweating and nausea',
  vitals: {
    bloodPressure: '160/95',
    heartRate: 110,
    temperature: 37.0,
    oxygenSaturation: 94,
  },
  expectedDiagnosis: 'Acute Myocardial Infarction',
  expectedUrgency: 'emergency',
  expectedConfidence: 90,
  alternativeDiagnoses: ['Unstable Angina', 'Aortic Dissection', 'Pulmonary Embolism'],
  redFlags: ['Chest pain radiating to arm', 'Diaphoresis', 'Elevated heart rate'],
}
```

## Diagnosis Matching Logic

The test suite uses fuzzy matching to account for variations in diagnosis naming:

1. **Exact Match**: Normalized strings match exactly
2. **Contains Match**: One diagnosis name contains the other
3. **Synonym Matching**: Common medical synonyms are recognized
   - "Myocardial Infarction" = "MI" = "Heart Attack" = "STEMI" = "NSTEMI"
   - "Stroke" = "CVA" = "Cerebrovascular Accident"
   - "Pneumonia" = "Community-Acquired Pneumonia" = "CAP"
   - And many more...

## Performance Report Format

The test suite generates a comprehensive report including:

```
╔══════════════════════════════════════════════════════════════════╗
║           BRAIN PERFORMANCE TEST REPORT                          ║
╚══════════════════════════════════════════════════════════════════╝

📊 OVERALL METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Cases Tested:        100
  Top-1 Accuracy:            85/100 (85.00%)
  Top-3 Accuracy:            96/100 (96.00%)
  Urgency Accuracy:          92/100 (92.00%)
  Average Execution Time:    2500ms

📁 CATEGORY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  emergency: 18/20 (90%)
  common: 27/30 (90%)
  complex: 15/20 (75%)
  pediatric: 9/10 (90%)
  geriatric: 8/10 (80%)
  iraqi-specific: 8/10 (80%)

🎯 DIFFICULTY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  easy: 21/23 (91%)
  medium: 34/39 (87%)
  hard: 30/38 (79%)

❌ FAILED CASES (Top 10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CPX-009: Expected "Acromegaly", Got "Pituitary Adenoma"
  CPX-016: Expected "Pheochromocytoma", Got "Panic Disorder"
  ...

✅ PERFORMANCE TARGETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Target Top-1 Accuracy:     ≥85% ✓
  Target Top-3 Accuracy:     ≥95% ✓
  Target Urgency Accuracy:   ≥90% ✓
  Target Execution Time:     <3000ms ✓
```

## Continuous Improvement

The test suite is designed to support continuous improvement of the BRAIN system:

1. **Baseline Measurement**: Establish current performance across all categories
2. **Training Data Expansion**: Measure improvement after adding new medical knowledge
3. **Algorithm Refinement**: Validate changes to reasoning logic
4. **Regression Testing**: Ensure new features don't degrade existing performance
5. **Specialty Focus**: Identify weak areas for targeted improvement

## Known Issues

1. **PubMed Caching**: Current implementation has a minor caching issue that's being addressed
2. **LLM API Rate Limits**: Full test suite may hit rate limits; use sample test for rapid iteration
3. **Database Connection**: Tests require active database connection for case history storage

## Future Enhancements

1. **Parallel Test Execution**: Reduce total test time by running cases in parallel
2. **Confidence Calibration**: Add metrics for confidence score accuracy
3. **Explanation Quality**: Evaluate quality of clinical reasoning explanations
4. **Multi-Language Testing**: Add Arabic language test cases
5. **Real-World Validation**: Compare against actual clinical outcomes

## Integration with Training System

The performance test suite integrates with BRAIN's continuous learning system:

- Failed cases can be automatically added to training data
- Clinician feedback from real cases can be incorporated
- Performance metrics track improvement over time
- Test results inform training material prioritization

## Conclusion

This comprehensive testing suite provides rigorous validation of BRAIN's diagnostic capabilities across diverse clinical scenarios, difficulty levels, and patient populations. Regular execution of these tests ensures consistent, high-quality performance as the system evolves.

---

**Last Updated**: December 20, 2025
**Test Suite Version**: 1.0
**Total Test Cases**: 100
