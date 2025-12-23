# Comprehensive Fix Implementation Plan

## Overview
This document outlines the systematic approach to fix all 12 identified issues in the conversational assessment system.

---

## Phase 1: Critical Frontend Fixes (MUST DO)

### Fix 1.1: Add Context State Management
**File:** `client/src/pages/SymptomChecker.tsx`
**Action:** Add context state to track conversation context between requests

```typescript
// Add after line 56
const [context, setContext] = useState<any>(null);
```

### Fix 1.2: Switch to Conversational Router
**File:** `client/src/pages/SymptomChecker.tsx` line 59
**Action:** Change from triageEnhanced to conversational router

```typescript
// BEFORE:
const sendMessage = trpc.triageEnhanced.chatWithRecommendations.useMutation({

// AFTER:
const sendMessage = trpc.conversational.sendMessage.useMutation({
```

### Fix 1.3: Update Mutation Input Format
**File:** `client/src/pages/SymptomChecker.tsx` lines 102-112
**Action:** Change input format to match conversational router schema

```typescript
// BEFORE:
sendMessage.mutate({
  messages: [...messages...],
  language: language === "ar" ? "ar" : "en",
  requestFinalAssessment: shouldRequestAssessment,
});

// AFTER:
sendMessage.mutate({
  message: input,
  context: context,
  language: language === "ar" ? "ar" : "en"
});
```

### Fix 1.4: Update Response Processing
**File:** `client/src/pages/SymptomChecker.tsx` lines 60-75
**Action:** Extract and save context from response

```typescript
// BEFORE:
onSuccess: (data: { content: string; recommendations?: Recommendations; isFinalAssessment?: boolean }) => {
  setMessages((prev) => [...prev, { content: data.content, ... }]);
  if (data.recommendations && data.isFinalAssessment) {
    setRecommendations(data.recommendations);
  }
}

// AFTER:
onSuccess: (data) => {
  setMessages((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      role: "assistant",
      content: data.message,
      timestamp: new Date(),
    },
  ]);
  
  // SAVE CONTEXT FOR NEXT REQUEST
  setContext(data.context);
  
  // Handle final triage result
  if (data.triageResult) {
    // Convert to Recommendations format
    const recommendations: Recommendations = {
      urgencyLevel: data.triageResult.urgency,
      urgencyDescription: `Urgency: ${data.triageResult.urgency}`,
      possibleConditions: data.triageResult.possibleConditions.map(c => c.name),
      recommendedActions: data.triageResult.recommendations,
      redFlagSymptoms: data.triageResult.redFlags,
      timelineForCare: "As recommended above",
    };
    setRecommendations(recommendations);
  }
}
```

### Fix 1.5: Initialize Conversation on Mount
**File:** `client/src/pages/SymptomChecker.tsx`
**Action:** Call startConversation to get initial context

```typescript
// Add after state declarations
const startConversation = trpc.conversational.startConversation.useMutation({
  onSuccess: (data) => {
    setContext(data.context);
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: data.message,
      timestamp: new Date(),
    }]);
  }
});

useEffect(() => {
  startConversation.mutate({ language: language === "ar" ? "ar" : "en" });
}, []); // Run once on mount
```

---

## Phase 2: Backend Improvements

### Fix 2.1: Increase Conversation History Limit
**File:** `server/conversational-assessment.ts` line 194
**Action:** Increase from 10 to 20 messages

```typescript
// BEFORE:
...vector.conversationHistory.slice(-10).map(msg => ({

// AFTER:
...vector.conversationHistory.slice(-20).map(msg => ({
```

### Fix 2.2: Fix Prompt Wording
**File:** `server/conversational-assessment.ts` line 139
**Action:** Remove confusing "above" reference

```typescript
// BEFORE:
CRITICAL: Review the conversation history above to see what questions you've already asked...

// AFTER:
CRITICAL: Review the conversation history to see what questions you've already asked and what answers the patient provided...
```

### Fix 2.3: Only Increment Step on Success
**File:** `server/conversational-assessment.ts` line 235
**Action:** Move step increment inside success block

```typescript
// BEFORE (line 235):
vector.stepCount = currentStep + 1;

// AFTER: Move this line to AFTER successful JSON parsing (around line 218)
// And also increment in catch block only if using fallback
```

---

## Phase 3: Cleanup

### Fix 3.1: Remove Unused sessionId
**File:** `client/src/pages/SymptomChecker.tsx` line 54
**Action:** Remove unused state

```typescript
// REMOVE:
const [sessionId, setSessionId] = useState<string | null>(null);
```

### Fix 3.2: Don't Filter Welcome Message
**File:** `client/src/pages/SymptomChecker.tsx` line 104
**Action:** This will be removed when we switch to conversational router (no longer sending messages array)

---

## Implementation Order

1. **First:** Implement Phase 1 fixes (all frontend changes together)
2. **Second:** Implement Phase 2 fixes (backend improvements)
3. **Third:** Test thoroughly with user's scenario
4. **Fourth:** Implement Phase 3 cleanup
5. **Finally:** Create checkpoint and document

---

## Testing Checklist

After implementing all fixes, test:

- [ ] New conversation starts with proper greeting
- [ ] Context is maintained between messages
- [ ] AI doesn't repeat questions
- [ ] User's exact scenario works:
  - [ ] "headache for 2 days worsen when moving"
  - [ ] "sharp"
  - [ ] "fever 39"
  - [ ] "2 days"
  - [ ] AI should NOT ask "how long" or "what symptoms" again
- [ ] Final assessment is generated after ~10 exchanges
- [ ] Recommendations are displayed correctly
- [ ] Arabic language works
- [ ] Error handling works (test with invalid input)

---

## Rollback Plan

If fixes cause issues:
1. Use `webdev_rollback_checkpoint` to restore to version 905aae7b
2. Review audit documents to understand what went wrong
3. Implement fixes more incrementally

---

## Files to Modify

1. `client/src/pages/SymptomChecker.tsx` - Major rewrite
2. `server/conversational-assessment.ts` - Minor improvements
3. `server/conversational-context-vector.ts` - Already fixed

---

## Expected Outcome

After all fixes:
- Frontend uses conversational router
- Context persists between messages
- AI has full conversation history
- No repeated questions
- Smooth 10-step assessment flow
- Proper final recommendations
