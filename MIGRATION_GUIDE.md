# Migration Guide: Resilient LLM Integration

## Overview
This guide documents the migration from direct `invokeLLM()` calls to the resilient wrapper `invokeResilientLLM()` which provides:
- Automatic retry with exponential backoff
- Circuit breaker protection
- Timeout handling
- Semantic caching
- Fallback mechanisms
- Comprehensive error reporting

## Status: PARTIALLY COMPLETED

### ✅ Completed Files (2/103 LLM calls)
1. **server/clinical-reasoning.ts** - ✅ Migrated
   - Added retry logic (3 attempts)
   - Added timeout protection (30s)
   - Added semantic caching
   - Added fallback mechanism

2. **server/_core/resilient-llm.ts** - ✅ Created
   - Core resilient wrapper implementation
   - Circuit breaker integration
   - Retry manager integration
   - Batch processing support

3. **server/_core/semantic-cache.ts** - ✅ Created
   - LRU cache with TTL
   - Semantic similarity matching
   - Cache statistics tracking

### 🔄 In Progress
- **server/routers.ts** - Needs completion (multiple LLM calls)
- **server/brain/** - Multiple files with LLM calls
- **server/conversational-router.ts** - Streaming LLM calls
- **server/lab-router.ts** - OCR and analysis calls

### 📋 Remaining Files (101 LLM calls)
The following files still use direct LLM calls and need migration:

```bash
# Get list of all files with LLM calls
cd /home/ubuntu/meditriage-ai
grep -r "invokeLLM\|invokeDeepSeek\|deepMedicalReasoning" server --include="*.ts" -l
```

## Migration Pattern

### Before (Direct Call)
```typescript
import { invokeLLM } from './_core/llm';

const response = await invokeLLM({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
});
```

### After (Resilient Call)
```typescript
import { invokeResilientLLM } from './_core/resilient-llm';
import { getSemanticCache } from './_core/semantic-cache';

const cache = getSemanticCache();
const cacheKey = `operation-name:${JSON.stringify(inputParams)}`;

const response = await invokeResilientLLM(
  {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  },
  {
    operation: 'operation-name',
    requestId: `req-${Date.now()}`,
    metadata: { /* relevant context */ },
  },
  {
    retries: 3,
    timeout: 30000,
    fallback: async () => {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      throw new Error('Service temporarily unavailable');
    },
  }
);

// Cache successful response
await cache.set(cacheKey, response);
```

## Priority Migration Order

### P0 - Critical (Do First)
1. ✅ **clinical-reasoning.ts** - Core diagnosis logic
2. **routers.ts** - Main triage chat endpoint
3. **conversational-router.ts** - User-facing chat
4. **brain/avicenna-router.ts** - Advanced reasoning

### P1 - High Priority
5. **lab-router.ts** - Lab analysis
6. **symptom-checker-structured.ts** - Symptom analysis
7. **triage-enhanced.ts** - Enhanced triage
8. **brain/training/training-pipeline.ts** - Training system

### P2 - Medium Priority
9. **pharmaguard-router.ts** - Drug interactions
10. **consultation-router.ts** - Consultations
11. **soap-router.ts** - SOAP notes
12. All remaining brain/* files

## Caching Strategy

### Cache TTL by Operation Type
- **Clinical reasoning**: 1 hour (symptoms don't change frequently)
- **Chat messages**: 30 minutes (conversational context)
- **Lab analysis**: 24 hours (results are stable)
- **Drug interactions**: 6 hours (reference data)
- **Training**: No cache (always fresh)

### Cache Key Design
```typescript
// Include all parameters that affect the output
const cacheKey = `${operation}:${JSON.stringify({
  // Only include relevant fields
  symptoms: input.symptoms.sort(), // Sort for consistency
  age: Math.floor(input.age / 10) * 10, // Bin by decade
  // Exclude: requestId, timestamp, userId (not relevant to output)
})}`;
```

## Circuit Breaker Configuration

### Default Thresholds
- **Failure threshold**: 5 consecutive failures → OPEN
- **Success threshold**: 2 consecutive successes → CLOSED
- **Timeout**: 30 seconds per request
- **Reset timeout**: 60 seconds (how long circuit stays OPEN)

### Per-Operation Overrides
```typescript
// For critical operations, be more lenient
invokeResilientLLM(params, context, {
  circuitBreaker: 'critical-diagnosis',
  // Will use default thresholds from CircuitBreakerRegistry
});

// For non-critical operations, fail faster
invokeResilientLLM(params, context, {
  circuitBreaker: 'chat-summary',
  timeout: 10000, // 10s instead of 30s
});
```

## Testing Strategy

### Unit Tests
```typescript
// Test retry logic
it('should retry on transient failures', async () => {
  let attempts = 0;
  const mockLLM = jest.fn(() => {
    attempts++;
    if (attempts < 3) throw new Error('timeout');
    return mockResponse;
  });
  
  const result = await invokeResilientLLM(params, context, { retries: 3 });
  expect(attempts).toBe(3);
  expect(result).toEqual(mockResponse);
});

// Test circuit breaker
it('should open circuit after threshold failures', async () => {
  // Trigger 5 failures
  for (let i = 0; i < 5; i++) {
    await expect(invokeResilientLLM(params, context)).rejects.toThrow();
  }
  
  // Circuit should be OPEN
  const status = getLLMCircuitStatus('operation-name');
  expect(status).toBe('OPEN');
});

// Test caching
it('should return cached response on cache hit', async () => {
  const cache = getSemanticCache();
  await cache.set(cacheKey, mockResponse);
  
  const result = await invokeResilientLLM(params, context);
  expect(result).toEqual(mockResponse);
  // LLM should not be called
  expect(mockLLM).not.toHaveBeenCalled();
});
```

### Integration Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/clinical-reasoning.test.ts

# Run with coverage
pnpm test --coverage
```

## Monitoring & Metrics

### Key Metrics to Track
1. **Cache hit rate**: Should be >40% after warmup
2. **Retry rate**: Should be <5% in normal operation
3. **Circuit breaker state**: Should be CLOSED >99% of time
4. **P99 latency**: Should be <5s with retries
5. **Error rate**: Should be <1% with all resilience layers

### Monitoring Commands
```typescript
// Get cache statistics
const cache = getSemanticCache();
console.log(cache.getStats());
// Output: { size: 234, hits: 1234, misses: 456, hitRate: "73.01%" }

// Get circuit breaker status
const status = getLLMCircuitStatus('clinical-reasoning');
console.log(status); // "CLOSED" | "OPEN" | "HALF_OPEN"

// Get predictive monitor health
const monitor = getPredictiveMonitor();
const health = monitor.getHealthReport('llm');
console.log(health);
```

## Rollback Plan

If issues arise, you can quickly rollback:

```typescript
// Option 1: Disable retry (but keep circuit breaker)
invokeResilientLLM(params, context, { retries: 1 });

// Option 2: Disable circuit breaker
// (Remove from CircuitBreakerRegistry)

// Option 3: Full rollback to direct calls
// Replace invokeResilientLLM with invokeLLM
import { invokeLLM } from './_core/llm';
const response = await invokeLLM(params);
```

## Performance Impact

### Expected Improvements
- **Availability**: 99.5% → 99.9% (3x reduction in downtime)
- **P99 latency**: May increase by 10-20% due to retries (acceptable tradeoff)
- **Cost**: 30-40% reduction due to caching
- **Error rate**: 5% → 0.5% (10x improvement)

### Resource Usage
- **Memory**: +50MB for cache (configurable via maxSize)
- **CPU**: Negligible (<1% overhead)
- **Network**: Reduced by 30-40% due to caching

## Next Steps

1. **Complete migration of P0 files** (routers.ts, conversational-router.ts)
2. **Add integration tests** for resilient wrapper
3. **Set up monitoring dashboard** for metrics
4. **Migrate P1 files** (lab-router.ts, symptom-checker, etc.)
5. **Deploy to staging** and monitor for 24 hours
6. **Migrate remaining files** (P2)
7. **Remove direct invokeLLM imports** after full migration

## Support

For questions or issues during migration:
1. Check IMPROVEMENT_AUDIT.md for detailed analysis
2. Review resilient-llm.ts implementation
3. Test in isolation before deploying
4. Monitor error logs for unexpected behavior

---

**Last Updated**: December 28, 2025  
**Migration Status**: 2% complete (2/103 calls migrated)  
**Next Milestone**: Complete P0 files (Target: 100% of critical paths)
