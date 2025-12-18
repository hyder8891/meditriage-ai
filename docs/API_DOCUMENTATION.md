# MediTriage AI Pro - API Documentation

**Version 1.0** | **Last Updated:** December 2025 | **Author:** Manus AI

---

## Overview

MediTriage AI Pro is built on a modern tRPC-based architecture that provides type-safe, end-to-end API communication between the client and server. This documentation describes the available API procedures, their inputs, outputs, and usage patterns for developers integrating with or extending the platform.

The API is organized into logical routers covering authentication, clinical operations, patient services, and system functions. All procedures are protected by authentication middleware unless explicitly marked as public, ensuring secure access to sensitive medical data.

---

## Architecture

### Technology Stack

The backend is powered by **Express 4** with **tRPC 11** for type-safe API definitions. Database operations use **Drizzle ORM** with **MySQL/TiDB** as the underlying database. Authentication is handled through **Manus OAuth** with JWT-based session management. The system integrates with external AI services including **DeepSeek** for clinical reasoning and **Gemini** for medical imaging analysis.

### Request/Response Format

All tRPC procedures communicate using JSON with automatic serialization handled by **SuperJSON**, which preserves JavaScript types including Date objects, undefined values, and BigInts. Requests are sent to the `/api/trpc` endpoint with procedure names encoded in the URL path. Responses follow a standard format with data, error, and metadata fields.

### Authentication

Protected procedures require a valid session token passed as an HTTP-only cookie. The authentication middleware validates the token and injects the current user context into each request. Public procedures can be accessed without authentication but have limited functionality.

---

## Authentication Router

### auth.me

**Type:** Query  
**Protection:** Public  
**Description:** Retrieves the currently authenticated user's profile information.

**Input:** None

**Output:**
```typescript
{
  id: number;
  openId: string;
  name: string;
  email: string;
  loginMethod: "google" | "github" | "email";
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
} | null
```

**Usage:** This procedure is called on application load to determine if a user is authenticated and retrieve their profile. Returns null if no valid session exists.

### auth.logout

**Type:** Mutation  
**Protection:** Protected  
**Description:** Terminates the current user session and clears the session cookie.

**Input:** None

**Output:**
```typescript
{
  success: boolean;
}
```

**Usage:** Call this procedure when the user clicks the logout button. The client should redirect to the login page after successful logout.

---

## Clinical Router

### clinical.createCase

**Type:** Mutation  
**Protection:** Protected  
**Description:** Creates a new patient case with demographic information and chief complaint.

**Input:**
```typescript
{
  patientName: string;
  patientAge: number;
  patientGender: "male" | "female" | "other";
  chiefComplaint: string;
  urgency: "emergency" | "urgent" | "semi-urgent" | "non-urgent" | "routine";
}
```

**Output:**
```typescript
{
  id: number;
  clinicianId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  chiefComplaint: string;
  urgency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Usage:** Called when a clinician initiates a new patient case. The case is automatically associated with the authenticated clinician's ID.

### clinical.getCases

**Type:** Query  
**Protection:** Protected  
**Description:** Retrieves all cases created by the authenticated clinician.

**Input:** None

**Output:**
```typescript
Array<{
  id: number;
  clinicianId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  chiefComplaint: string;
  urgency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Usage:** Called on the clinician dashboard to display the case list. Cases are ordered by most recent first.

### clinical.getCaseById

**Type:** Query  
**Protection:** Protected  
**Description:** Retrieves detailed information for a specific case including vitals, diagnoses, and notes.

**Input:**
```typescript
{
  caseId: number;
}
```

**Output:**
```typescript
{
  id: number;
  clinicianId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  chiefComplaint: string;
  urgency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  vitals: Array<VitalSigns>;
  diagnoses: Array<Diagnosis>;
  notes: Array<ClinicalNote>;
}
```

**Usage:** Called when viewing a specific case detail page. Returns comprehensive case information for clinical review.

### clinical.recordVitals

**Type:** Mutation  
**Protection:** Protected  
**Description:** Records vital signs for a patient case.

**Input:**
```typescript
{
  caseId: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
}
```

**Output:**
```typescript
{
  id: number;
  caseId: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number | null;
  weight: number | null;
  height: number | null;
  recordedAt: Date;
}
```

**Usage:** Called when a clinician enters vital signs during patient assessment. Vitals are timestamped and associated with the case.

### clinical.analyzeClinicalCase

**Type:** Mutation  
**Protection:** Protected  
**Description:** Generates differential diagnoses and clinical recommendations using AI analysis.

**Input:**
```typescript
{
  symptoms: string;
  vitals: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  patientAge: number;
  patientGender: string;
  medicalHistory?: string;
}
```

**Output:**
```typescript
{
  differentialDiagnoses: Array<{
    condition: string;
    probability: number;
    reasoning: string;
  }>;
  redFlags: string[];
  recommendedActions: string[];
  urgencyLevel: string;
}
```

**Usage:** Called when the clinician requests AI-powered diagnostic assistance. The system analyzes symptoms and vitals to generate evidence-based recommendations.

### clinical.checkDrugInteractions

**Type:** Mutation  
**Protection:** Protected  
**Description:** Analyzes potential drug-drug interactions for a list of medications.

**Input:**
```typescript
{
  medications: string[];
}
```

**Output:**
```typescript
{
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: "major" | "moderate" | "minor";
    description: string;
    recommendation: string;
  }>;
  safetyScore: number;
}
```

**Usage:** Called when checking medication safety in the PharmaGuard feature. Returns interaction details and management recommendations.

### clinical.analyzeXray

**Type:** Mutation  
**Protection:** Protected  
**Description:** Analyzes X-ray images using AI to identify potential abnormalities.

**Input:**
```typescript
{
  imageUrl: string;
  bodyPart: string;
  clinicalContext?: string;
}
```

**Output:**
```typescript
{
  findings: string[];
  impressions: string;
  recommendations: string[];
  confidence: number;
}
```

**Usage:** Called when a clinician uploads an X-ray image for AI analysis. The system identifies potential abnormalities and provides clinical impressions.

### clinical.searchFacilities

**Type:** Query  
**Protection:** Protected  
**Description:** Searches for medical facilities in Iraq by type and city.

**Input:**
```typescript
{
  type?: "hospital" | "clinic" | "emergency" | "specialist" | "";
  city?: string;
}
```

**Output:**
```typescript
Array<{
  id: number;
  name: string;
  nameArabic: string;
  type: string;
  city: string;
  address: string;
  phone: string;
  specialties: string[];
  emergencyServices: boolean;
}>
```

**Usage:** Called in the Care Locator feature to find appropriate medical facilities. Empty type parameter returns all facility types.

### clinical.createTranscription

**Type:** Mutation  
**Protection:** Protected  
**Description:** Creates a new transcription record from audio file.

**Input:**
```typescript
{
  audioUrl: string;
  caseId?: number;
}
```

**Output:**
```typescript
{
  id: number;
  clinicianId: number;
  caseId: number | null;
  audioUrl: string;
  transcriptionText: string;
  speakerIdentification: string | null;
  createdAt: Date;
}
```

**Usage:** Called when Live Scribe processes recorded audio. The audio file is transcribed using Whisper API and stored with metadata.

### clinical.generateSOAPNote

**Type:** Mutation  
**Protection:** Protected  
**Description:** Generates structured SOAP format clinical notes from transcription text.

**Input:**
```typescript
{
  transcriptionText: string;
  caseId?: number;
}
```

**Output:**
```typescript
{
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}
```

**Usage:** Called when converting a transcription into structured SOAP documentation. The AI extracts relevant information into appropriate sections.

### clinical.getTimelineEvents

**Type:** Query  
**Protection:** Protected  
**Description:** Retrieves chronological timeline events for a patient case.

**Input:**
```typescript
{
  caseId: number;
  eventType?: "symptom" | "vital" | "diagnosis" | "treatment" | "medication" | "procedure" | "lab_result" | "imaging" | "note";
}
```

**Output:**
```typescript
Array<{
  id: number;
  caseId: number;
  eventType: string;
  eventDate: Date;
  title: string;
  description: string;
  severity: string | null;
  data: any;
  createdAt: Date;
}>
```

**Usage:** Called when displaying the case timeline visualization. Events can be filtered by type for focused review.

---

## Patient Router

### patient.analyzeSymptoms

**Type:** Mutation  
**Protection:** Public  
**Description:** Analyzes patient-reported symptoms and provides care recommendations.

**Input:**
```typescript
{
  symptoms: string;
  age?: number;
  gender?: string;
}
```

**Output:**
```typescript
{
  urgencyLevel: string;
  possibleConditions: string[];
  careGuide: string;
  doctorScript: string;
  homeCareAdvice: string;
}
```

**Usage:** Called from the patient portal symptom checker. Provides personalized health guidance based on symptom description.

---

## System Router

### system.notifyOwner

**Type:** Mutation  
**Protection:** Protected  
**Description:** Sends notification to the platform owner for operational alerts.

**Input:**
```typescript
{
  title: string;
  content: string;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

**Usage:** Called when backend processes need to alert the platform owner about important events, errors, or system status changes.

---

## Error Handling

### Error Response Format

When a procedure encounters an error, the response includes an error object with the following structure:

```typescript
{
  error: {
    code: string;
    message: string;
    data?: {
      code: string;
      httpStatus: number;
      path: string;
    };
  };
}
```

### Common Error Codes

**UNAUTHORIZED**: The request requires authentication but no valid session was provided. The client should redirect to the login page.

**FORBIDDEN**: The authenticated user does not have permission to access the requested resource. This typically occurs when trying to access another clinician's cases.

**BAD_REQUEST**: The input validation failed. Check the error message for details about which fields are invalid.

**NOT_FOUND**: The requested resource (case, transcription, etc.) does not exist or has been deleted.

**INTERNAL_SERVER_ERROR**: An unexpected error occurred on the server. These errors are logged for investigation.

**PARSE_ERROR**: The request body could not be parsed. Ensure you are sending valid JSON with correct field types.

---

## Rate Limiting

The API implements rate limiting to prevent abuse and ensure fair resource allocation. Authenticated users have higher rate limits than anonymous requests. If you exceed the rate limit, the API returns a 429 status code with a Retry-After header indicating when you can make additional requests.

Standard rate limits are 100 requests per minute for authenticated users and 20 requests per minute for anonymous requests. AI-powered procedures (clinical analysis, X-ray analysis, SOAP generation) have lower limits of 10 requests per minute due to computational costs.

---

## Best Practices

### Type Safety

The tRPC client automatically generates TypeScript types from the server-side procedure definitions, ensuring type safety across the entire stack. Always use the generated types rather than manually defining request/response shapes.

### Error Handling

Implement comprehensive error handling for all API calls. Use try-catch blocks for mutations and check the error property in query results. Display user-friendly error messages rather than exposing technical details to end users.

### Optimistic Updates

For mutations that modify data displayed in the UI, consider implementing optimistic updates to improve perceived performance. Update the local cache immediately when the mutation is called, then rollback if the mutation fails.

### Data Caching

The tRPC client automatically caches query results to reduce unnecessary network requests. Configure appropriate cache invalidation strategies to ensure users see up-to-date information after mutations.

### Batch Requests

When possible, batch multiple independent queries into a single request to reduce network overhead. The tRPC client supports automatic request batching with configurable batch windows.

---

## Integration Examples

### Creating a Case and Recording Vitals

```typescript
// Create a new case
const newCase = await trpc.clinical.createCase.mutate({
  patientName: "John Doe",
  patientAge: 45,
  patientGender: "male",
  chiefComplaint: "Chest pain and shortness of breath",
  urgency: "urgent"
});

// Record vital signs for the case
const vitals = await trpc.clinical.recordVitals.mutate({
  caseId: newCase.id,
  bloodPressureSystolic: 145,
  bloodPressureDiastolic: 92,
  heartRate: 98,
  temperature: 37.2,
  oxygenSaturation: 96
});

// Analyze the case with AI
const analysis = await trpc.clinical.analyzeClinicalCase.mutate({
  symptoms: "Chest pain and shortness of breath",
  vitals: {
    bloodPressureSystolic: 145,
    bloodPressureDiastolic: 92,
    heartRate: 98,
    temperature: 37.2,
    oxygenSaturation: 96
  },
  patientAge: 45,
  patientGender: "male"
});
```

### Live Scribe Workflow

```typescript
// Upload audio file to storage
const audioUrl = await uploadAudioFile(audioBlob);

// Create transcription
const transcription = await trpc.clinical.createTranscription.mutate({
  audioUrl: audioUrl,
  caseId: currentCaseId
});

// Generate SOAP note from transcription
const soapNote = await trpc.clinical.generateSOAPNote.mutate({
  transcriptionText: transcription.transcriptionText,
  caseId: currentCaseId
});
```

### Patient Symptom Analysis

```typescript
// Analyze patient symptoms
const analysis = await trpc.patient.analyzeSymptoms.mutate({
  symptoms: "Severe headache with nausea and sensitivity to light",
  age: 32,
  gender: "female"
});

// Display results to patient
console.log(`Urgency: ${analysis.urgencyLevel}`);
console.log(`Possible conditions: ${analysis.possibleConditions.join(", ")}`);
console.log(`Care guide: ${analysis.careGuide}`);
```

---

## Conclusion

The MediTriage AI Pro API provides a comprehensive set of procedures for building clinical decision support applications. The type-safe tRPC architecture ensures reliable communication between client and server while maintaining excellent developer experience. For additional support or questions about API integration, visit the developer documentation portal or contact the technical support team at https://help.manus.im.
