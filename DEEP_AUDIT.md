# DEEP SYSTEM AUDIT - Conversational Assessment

## Audit Date
Conducted: December 24, 2025

## Problem Statement
AI repeatedly asks the same questions (e.g., "how long?", "what symptoms?") despite user providing answers. User reported spending 10,000 credits with issue unresolved.

---

## LAYER 1: FRONTEND ANALYSIS

### File: client/src/pages/SymptomChecker.tsx

#### State Management
- [ ] Check message state structure
- [ ] Check context state management
- [ ] Check if context persists between messages
- [ ] Check state initialization
- [ ] Check state updates after responses

#### API Integration
- [ ] Check which tRPC endpoint is called
- [ ] Check input format sent to backend
- [ ] Check how responses are processed
- [ ] Check error handling

#### Message Flow
- [ ] Check how user input is captured
- [ ] Check how messages are added to state
- [ ] Check how conversation history is maintained

---

## LAYER 2: TRPC ROUTER ANALYSIS

### File: server/conversational-router.ts

#### Input Validation
- [ ] Check schema definitions
- [ ] Check if context schema matches what frontend sends
- [ ] Check optional/required fields
- [ ] Check type compatibility

#### Context Handling
- [ ] Check how context is received
- [ ] Check how context is passed to assessment engine
- [ ] Check how context is returned in response

#### Error Handling
- [ ] Check try-catch blocks
- [ ] Check fallback responses
- [ ] Check error logging

---

## LAYER 3: ASSESSMENT ENGINE ANALYSIS

### File: server/conversational-assessment.ts

#### Context Rehydration
- [ ] Check ConversationalContextVector instantiation
- [ ] Check if all fields are properly restored
- [ ] Check conversationHistory restoration

#### Conversation History Management
- [ ] Check how user messages are added
- [ ] Check how assistant messages are added
- [ ] Check history size limits
- [ ] Check if history is included in LLM calls

#### LLM Prompt Construction
- [ ] Check system prompt content
- [ ] Check if conversation history is in prompt
- [ ] Check if context data is in prompt
- [ ] Check prompt instructions about not repeating questions

#### Response Processing
- [ ] Check JSON parsing logic
- [ ] Check fallback mechanisms
- [ ] Check how extracted data updates context
- [ ] Check step counter logic

#### Context Serialization
- [ ] Check toJSON() call
- [ ] Check what fields are included
- [ ] Check if conversationHistory is serialized

---

## LAYER 4: CONTEXT VECTOR ANALYSIS

### File: server/conversational-context-vector.ts

#### Constructor
- [ ] Check if all fields are initialized
- [ ] Check conversationHistory initialization
- [ ] Check default values

#### toJSON Method
- [ ] Check all fields included in serialization
- [ ] Check conversationHistory included
- [ ] Check data types preserved

#### Update Methods
- [ ] Check symptom update logic
- [ ] Check deduplication logic
- [ ] Check other field updates

---

## LAYER 5: LLM INTEGRATION ANALYSIS

### File: server/_core/llm.ts (or equivalent)

- [ ] Check how messages are formatted
- [ ] Check token limits
- [ ] Check temperature settings
- [ ] Check response format

---

## AUDIT EXECUTION LOG

### Starting comprehensive audit...
