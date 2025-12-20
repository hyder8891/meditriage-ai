# BRAIN Performance Testing

## Quick Start

### Run Sample Test (12 cases, ~3-5 minutes)

```bash
npx tsx server/brain/brain-sample-test.ts
```

### Run Full Test Suite (100 cases, ~30-60 minutes)

```bash
pnpm test server/brain/brain-performance.test.ts --run
```

## Test Files

- **`test-cases.ts`**: 100 clinical case scenarios across 6 categories
- **`brain-performance.test.ts`**: Full vitest test suite with comprehensive reporting
- **`brain-sample-test.ts`**: Quick validation with representative cases

## Performance Targets

- Top-1 Accuracy: ≥85%
- Top-3 Accuracy: ≥95%
- Urgency Accuracy: ≥90%
- Execution Time: <3000ms per case

## Test Categories

1. Emergency Cases (20) - Life-threatening conditions
2. Common Conditions (30) - Primary care diagnoses
3. Complex Cases (20) - Multi-system involvement
4. Pediatric Cases (10) - Age-specific presentations
5. Geriatric Cases (10) - Elderly considerations
6. Iraqi-Specific Cases (10) - Local prevalence conditions

See `/home/ubuntu/meditriage-ai/BRAIN-PERFORMANCE-TESTING.md` for complete documentation.
