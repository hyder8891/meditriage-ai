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


## Security Audit Findings (From Code Review - IMMEDIATE PRIORITY)

### Critical Security Vulnerabilities
- [x] Fix DoS vulnerability in medical-records-router.ts - check Base64 string length BEFORE Buffer.from() conversion
- [x] Remove 'unsafe-inline' and 'unsafe-eval' from CSP in security.ts (lines 62-63)
- [x] Add input length limit (max 10KB) before regex testing in detectSuspiciousActivity function
- [x] Implement magic number file type detection using 'file-type' library instead of trusting user MIME types
- [ ] Make audit log failures block critical operations (or use Redis queue as fail-safe)
- [x] Add startup validation to throw error if DATABASE_URL or JWT_SECRET are missing

### Dependency Cleanup
- [x] Remove bcryptjs (line 59) - keep only bcrypt (line 58)
- [x] Remove jsonwebtoken (line 83) - keep only jose (line 82)
- [x] Update all auth code to use bcrypt and jose exclusively (already using correct libraries)

### Architecture Improvements
- [ ] Implement Redis-based rate limiting using @socket.io/redis-adapter (already in dependencies)
- [x] Add database indexes to drizzle schema: users.email (completed, others can be added as needed)

### File Upload Security
- [ ] Implement streaming uploads or presigned S3 URLs for files >1MB (future enhancement)
- [x] Add file type validation using magic numbers before S3 upload
- [ ] Sanitize file names more aggressively (currently allows dots and dashes)
