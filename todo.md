# MediTriage AI - Issues and Fixes

## Critical Issues

### 1. Conversational Assessment Function Signature Mismatch
- [x] Fix processConversationalAssessment parameter order (message, history, context vs message, context, history)
- [x] Ensure response includes all expected properties (quickReplies, differentialDiagnosis, etc.)
- [x] Add proper BRAIN integration for analysis stage

### 2. Memory Usage Critical
- [ ] Investigate memory leak in health monitor
- [ ] Optimize LLM response caching
- [ ] Review and reduce memory footprint of large data structures

### 3. Missing Response Properties
- [x] Add quickReplies generation logic
- [x] Implement differentialDiagnosis in response
- [x] Add proper Arabic translations (textAr fields)

### 4. Test Infrastructure
- [x] Reduced test failures from 9 to 8 (2 tests now passing)
- [x] Fixed test imports to use integrated version
- [x] Added stepCount to test contexts
- [ ] Fix remaining 8 BRAIN mock issues in tests
- [ ] Fix conversational-memory tests
- [ ] Ensure mocks are properly configured

## Completed
