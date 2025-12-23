# Accuracy Framework

A comprehensive, multi-layered accuracy improvement system for all AI-powered functions in MediTriage AI Pro.

## Overview

The Accuracy Framework provides:
- **Input Validation**: Ensures data quality before AI processing
- **Cross-Reference Validation**: Validates AI outputs against authoritative medical databases
- **Confidence Scoring**: Provides transparent confidence metrics for all AI outputs
- **Continuous Learning**: Improves accuracy over time through clinician feedback
- **Red Flag Detection**: Identifies potentially dangerous low-confidence outputs
- **Second Opinion Recommendations**: Suggests when expert consultation is needed

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Function Input                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Input Validation (input-validator.ts)             │
│  • Image quality assessment                                  │
│  • Text completeness validation                              │
│  • Signal quality metrics                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: AI Processing (existing functions)                 │
│  • BRAIN clinical reasoning                                  │
│  • Medical imaging analysis                                  │
│  • Lab results interpretation                                │
│  • etc.                                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Cross-Reference Validation (cross-reference.ts)   │
│  • UMLS/SNOMED CT terminology validation                     │
│  • PubMed literature search                                  │
│  • Drug database validation                                  │
│  • Reference range validation                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Confidence Scoring (confidence-scoring.ts)        │
│  • Multi-factor confidence calculation                       │
│  • Uncertainty quantification                                │
│  • Red flag detection                                        │
│  • Second opinion recommendation                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Feedback Loop (feedback-system.ts)                │
│  • Clinician corrections tracking                            │
│  • Accuracy metrics calculation                              │
│  • Error pattern identification                              │
│  • Retraining triggers                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced AI Output                         │
│  • Original AI result                                        │
│  • Confidence score & level                                  │
│  • Validation results                                        │
│  • Warnings & recommendations                                │
│  • Second opinion suggestion                                 │
└─────────────────────────────────────────────────────────────┘
```

## Modules

### 1. input-validator.ts
Validates input data quality before AI processing.

**Functions**:
- `validateMedicalImage()` - Assess image quality (resolution, brightness, contrast, sharpness)
- `validateLabReport()` - Check text completeness and OCR confidence
- `validateVitalSignal()` - Evaluate signal quality (SNR, stability, amplitude)
- `validateSymptomInput()` - Verify symptom description completeness

**Example**:
```typescript
import { validateMedicalImage } from './accuracy/input-validator';

const validation = await validateMedicalImage(imageUrl, 'xray');
if (!validation.isValid) {
  return { error: 'Image quality insufficient', issues: validation.issues };
}
```

### 2. cross-reference.ts
Validates AI outputs against authoritative medical databases.

**Functions**:
- `validateDiagnosis()` - Cross-reference diagnosis with ICD-10, SNOMED CT, medical knowledge
- `validateDrugInteraction()` - Check drug interactions against FDA/WHO databases
- `validateLabValue()` - Validate lab values against age/gender-specific reference ranges
- `validateImagingFinding()` - Verify imaging findings against radiological databases
- `searchPubMedLiterature()` - Find supporting medical literature

**Example**:
```typescript
import { validateDiagnosis } from './accuracy/cross-reference';

const validation = await validateDiagnosis(
  'Hypertension',
  ['headache', 'dizziness'],
  { age: 55, gender: 'male' }
);
console.log(validation.icd10Code); // ICD-10 code
console.log(validation.confidence); // 0-1
console.log(validation.sources); // ['Medical Knowledge Base', 'ICD-10 Classification']
```

### 3. confidence-scoring.ts
Calculates comprehensive confidence scores for AI outputs.

**Functions**:
- `calculateConfidence()` - Multi-factor confidence calculation
- `detectRedFlags()` - Identify potentially dangerous low-confidence outputs
- `shouldRequestSecondOpinion()` - Recommend expert consultation when needed
- `calculateCalibration()` - Assess how well confidence matches actual accuracy

**Confidence Levels**:
- **HIGH (80-100%)**: Strong evidence, multiple source validation
- **MODERATE (60-79%)**: Good evidence, some validation
- **LOW (40-59%)**: Limited evidence, minimal validation
- **VERY_LOW (<40%)**: Insufficient evidence, no validation

**Example**:
```typescript
import { calculateConfidence, detectRedFlags } from './accuracy/confidence-scoring';

const confidence = await calculateConfidence(aiOutput, {
  functionName: 'clinical-reasoning',
  inputValidation,
  crossReference,
  modelCertainty: 0.85
});

console.log(confidence.overall); // 0-100
console.log(confidence.level); // 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW'
console.log(confidence.recommendations); // Array of recommendations

const redFlags = detectRedFlags(confidence, aiOutput, {
  functionName: 'clinical-reasoning',
  isCritical: true
});

if (redFlags.hasRedFlags) {
  console.log('⚠️ Red flags detected:', redFlags.flags);
}
```

### 4. feedback-system.ts
Tracks clinician feedback and improves accuracy over time.

**Functions**:
- `recordCorrection()` - Record explicit corrections from clinicians
- `recordModification()` - Track implicit modifications
- `recordOutcome()` - Track patient outcomes
- `recordRating()` - Collect clinician ratings
- `analyzeAccuracyTrends()` - Calculate accuracy metrics over time
- `identifyErrorPatterns()` - Find common error patterns

**Example**:
```typescript
import { recordCorrection, analyzeAccuracyTrends } from './accuracy/feedback-system';

// Record clinician correction
await recordCorrection(
  'clinical-reasoning',
  aiDiagnosis,
  correctDiagnosis,
  clinicianId
);

// Analyze trends
const trends = await analyzeAccuracyTrends('clinical-reasoning', {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31')
});

console.log(trends.accuracy); // 0-1
console.log(trends.trendDirection); // 'IMPROVING' | 'STABLE' | 'DEGRADING'
console.log(trends.errorCategories); // { 'Incorrect Diagnosis': 5, ... }
```

## Integration Guide

### Step-by-Step Integration

1. **Import modules**:
```typescript
import { validateSymptomInput } from './accuracy/input-validator';
import { validateDiagnosis } from './accuracy/cross-reference';
import { calculateConfidence, detectRedFlags } from './accuracy/confidence-scoring';
import { recordCorrection } from './accuracy/feedback-system';
```

2. **Validate input**:
```typescript
const inputValidation = validateSymptomInput(symptoms);
if (!inputValidation.isValid) {
  return { error: 'Invalid input', issues: inputValidation.issues };
}
```

3. **Run AI processing** (existing logic):
```typescript
const aiOutput = await runYourAIFunction(input);
```

4. **Cross-reference validation**:
```typescript
const crossReference = await validateDiagnosis(
  aiOutput.diagnosis,
  symptoms,
  patientContext
);
```

5. **Calculate confidence**:
```typescript
const confidence = await calculateConfidence(aiOutput, {
  functionName: 'your-function-name',
  inputValidation,
  crossReference,
  modelCertainty: aiOutput.confidence
});
```

6. **Detect red flags**:
```typescript
const redFlags = detectRedFlags(confidence, aiOutput, {
  functionName: 'your-function-name',
  isCritical: aiOutput.urgency === 'EMERGENCY'
});
```

7. **Return enhanced output**:
```typescript
return {
  ...aiOutput,
  accuracy: {
    confidence,
    redFlags,
    validation: { input: inputValidation, crossReference }
  },
  warnings: redFlags.hasRedFlags ? redFlags.flags.map(f => f.message) : [],
  recommendations: confidence.recommendations
};
```

8. **Record feedback** (when clinician provides correction):
```typescript
await recordCorrection(
  'your-function-name',
  aiOutput,
  clinicianCorrection,
  clinicianId
);
```

### Complete Example

See `example-integration.ts` for complete working examples of:
- Enhanced Clinical Reasoning (BRAIN)
- Enhanced Medical Imaging Analysis
- Enhanced Lab Results Interpretation
- Clinician Feedback Handling

## Configuration

### Function-Specific Weights

Customize confidence calculation weights for each function:

```typescript
const FUNCTION_WEIGHTS = {
  'medical-imaging': {
    inputQuality: 0.25,      // Image quality is critical
    crossReferenceAgreement: 0.25
  },
  'lab-results': {
    crossReferenceAgreement: 0.35,  // Reference ranges are critical
    inputQuality: 0.20               // OCR quality matters
  },
  'drug-interactions': {
    crossReferenceAgreement: 0.40,  // Database validation is critical
    evidenceStrength: 0.20
  }
};
```

### Retraining Threshold

Adjust when retraining is triggered:

```typescript
const RETRAINING_THRESHOLD = 100; // Retrain after 100 feedback records
```

## Metrics & Monitoring

### Accuracy Metrics
- **Accuracy**: % of correct predictions
- **Precision**: % of positive predictions that were correct
- **Recall**: % of actual positives that were identified
- **F1 Score**: Harmonic mean of precision and recall
- **Confidence Calibration**: How well confidence scores match actual accuracy

### Trend Analysis
- **IMPROVING**: Accuracy increasing over time
- **STABLE**: Accuracy consistent
- **DEGRADING**: Accuracy decreasing (triggers alert)

### Error Categorization
- Incorrect Diagnosis
- Medication Error
- Dosage Error
- Missed Interaction
- Imaging Interpretation Error
- Other Error

## Best Practices

1. **Always validate input** before AI processing
2. **Use appropriate function-specific weights** for confidence calculation
3. **Record all clinician feedback** to enable continuous learning
4. **Monitor accuracy trends** regularly
5. **Act on red flags immediately** - never ignore critical warnings
6. **Request second opinion** when confidence is low or situation is critical
7. **Review error patterns** monthly to identify systemic issues

## Roadmap

### Phase 1: Foundation ✅
- Input validation system
- Cross-reference validation
- Confidence scoring
- Feedback system

### Phase 2: Integration (In Progress)
- Integrate with BRAIN clinical reasoning
- Integrate with medical imaging analysis
- Integrate with lab results interpretation
- Integrate with drug interaction checker

### Phase 3: Advanced Features (Planned)
- Real-time accuracy monitoring dashboard
- Automated retraining pipeline
- A/B testing framework
- Multi-model ensemble support

### Phase 4: Production Deployment (Planned)
- Database persistence for feedback
- API integration with external medical databases
- Performance optimization
- Comprehensive testing

## Support

For questions or issues with the Accuracy Framework, contact the development team or refer to the main framework documentation in `/ACCURACY_FRAMEWORK.md`.

## License

Internal use only - MediTriage AI Pro
