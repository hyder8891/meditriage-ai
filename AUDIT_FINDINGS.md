# Conversational Assessment System Audit

## Issue: AI keeps asking the same questions repeatedly, ignoring previous answers

## Audit Checklist

### 1. Frontend - Chat Interface
- [ ] Check how messages are sent
- [ ] Check how context is passed between messages
- [ ] Check if conversation history is maintained in UI state

### 2. Backend - tRPC Router
- [ ] Check how context is received from frontend
- [ ] Check how context is passed to assessment engine
- [ ] Check how response context is returned to frontend

### 3. Backend - Assessment Engine
- [ ] Check how conversation history is stored
- [ ] Check how conversation history is passed to LLM
- [ ] Check how conversation history is serialized/deserialized

### 4. Backend - Context Vector
- [ ] Check if conversationHistory is included in toJSON()
- [ ] Check if conversationHistory is restored in constructor

## Findings

### Finding 1: conversationHistory not serialized
**Location:** `server/conversational-context-vector.ts` line 206-224
**Issue:** The `toJSON()` method was missing `conversationHistory` field
**Status:** FIXED - Added conversationHistory to toJSON()

### Finding 2: [To be documented]

### Finding 3: [To be documented]

## Next Steps
1. Trace complete message flow
2. Add debug logging
3. Test with exact user scenario


### Finding 2: Frontend using WRONG router (CRITICAL)
**Location:** `client/src/pages/SymptomChecker.tsx` line 59
**Issue:** Frontend is calling `trpc.triageEnhanced.chatWithRecommendations` instead of `trpc.conversational.sendMessage`
**Impact:** All the conversational assessment engine fixes are NOT being used
**Details:**
- `triageEnhanced` router (server/triage-enhanced.ts) does NOT maintain conversation history
- It just passes messages to DeepSeek without any context tracking
- The conversational router (server/conversational-router.ts) with full history tracking exists but is NOT being used
**Status:** NEEDS FIX - Frontend must be switched to use conversational router

### Finding 3: triageEnhanced router has NO memory
**Location:** `server/triage-enhanced.ts`
**Issue:** This router doesn't use ConversationalContextVector at all
**Details:**
- It receives messages array from frontend
- Passes them directly to DeepSeek
- No conversation history persistence
- No context tracking between messages
**Status:** This explains why AI keeps asking same questions

### Finding 4: Frontend passes all messages but loses them
**Location:** `client/src/pages/SymptomChecker.tsx` lines 102-112
**Issue:** Frontend sends all messages in the array, but backend doesn't maintain state
**Details:**
- Frontend correctly maintains messages in state
- Sends all messages to backend on each request
- But triageEnhanced router doesn't use context system
- Each request is treated as independent
**Status:** Frontend logic is correct but calling wrong endpoint

## Root Cause Analysis

The system has TWO separate symptom checker implementations:

1. **OLD SYSTEM (currently in use):**
   - Frontend: SymptomChecker.tsx → trpc.triageEnhanced.chatWithRecommendations
   - Backend: triage-enhanced.ts → Direct DeepSeek calls
   - NO conversation context tracking
   - NO memory between messages

2. **NEW SYSTEM (built but not connected):**
   - Frontend: NOT CONNECTED
   - Backend: conversational-router.ts → conversational-assessment.ts → ConversationalContextVector
   - FULL conversation history tracking
   - Proper context management

## Solution Required

Switch frontend to use the conversational router system that has proper memory management.


## Complete System Architecture Analysis

### Current State (BROKEN)
```
User → SymptomChecker.tsx 
     → trpc.triageEnhanced.chatWithRecommendations
     → triage-enhanced.ts (NO CONTEXT TRACKING)
     → DeepSeek API (receives messages but no persistent context)
     → Response (AI has no memory of previous exchanges)
```

### Correct State (NEEDS TO BE IMPLEMENTED)
```
User → SymptomChecker.tsx 
     → trpc.conversational.sendMessage
     → conversational-router.ts
     → conversational-assessment.ts
     → ConversationalContextVector (maintains history + extracted data)
     → LLM with full conversation history
     → Response with updated context
```

## All Issues Summary

| # | Issue | Location | Severity | Status |
|---|-------|----------|----------|--------|
| 1 | conversationHistory not serialized | conversational-context-vector.ts:206 | HIGH | ✅ FIXED |
| 2 | Frontend using wrong router | SymptomChecker.tsx:59 | CRITICAL | ❌ NOT FIXED |
| 3 | triageEnhanced has no memory | triage-enhanced.ts | CRITICAL | ❌ NOT FIXED |
| 4 | Messages sent but context lost | Frontend/Backend mismatch | CRITICAL | ❌ NOT FIXED |

## Fix Strategy

### Phase 1: Update Frontend to use conversational router
1. Change `trpc.triageEnhanced.chatWithRecommendations` to `trpc.conversational.sendMessage`
2. Update input format to match conversational router schema
3. Maintain context state in frontend
4. Pass context with each message

### Phase 2: Test the conversational flow
1. Test with user's exact scenario
2. Verify conversation history is maintained
3. Verify AI doesn't repeat questions
4. Verify final assessment works

### Phase 3: Consider deprecating old system
1. Evaluate if triageEnhanced is used elsewhere
2. If not, mark as deprecated
3. Document migration path
