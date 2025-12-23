/**
 * Conversational AI Assessment System
 * 
 * Multi-stage conversation flow for patient symptom assessment:
 * 1. Greeting & Initial Symptoms
 * 2. Follow-up Questions (context gathering)
 * 3. Analysis & Triage
 * 4. Recommendations & Actions
 */

import { invokeLLM } from "./_core/llm";
import { enhancedBrain } from "./brain/brain-enhanced";
// Avicenna-X validation (simplified for now)
const validateMedicalConcept = async (concept: string, type: string) => ({ isValid: true });

// ============================================================================
// Types & Interfaces
// ============================================================================

export type TriageLevel = "green" | "yellow" | "red";

export interface QuickReplyChip {
  text: string;
  textAr?: string; // Arabic translation
  value: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AssessmentResponse {
  message: string;
  messageAr?: string; // Arabic translation
  quickReplies?: QuickReplyChip[];
  triageLevel?: TriageLevel;
  triageReason?: string;
  triageReasonAr?: string;
  recommendations?: string[];
  recommendationsAr?: string[];
  differentialDiagnosis?: Array<{
    condition: string;
    conditionAr?: string;
    probability: number;
    reasoning: string;
  }>;
  showActions?: boolean; // Show "Find Doctor" and "Book Appointment" buttons
  conversationStage: "greeting" | "gathering" | "analyzing" | "complete";
}

interface ConversationContext {
  symptoms: string[];
  duration?: string;
  severity?: string;
  location?: string;
  aggravatingFactors?: string[];
  relievingFactors?: string[];
  associatedSymptoms?: string[];
  medicalHistory?: string[];
  medications?: string[];
  age?: number;
  gender?: string;
}

// ============================================================================
// Conversation Flow Engine
// ============================================================================

/**
 * Main entry point for conversational assessment
 */
export async function processConversationalAssessment(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  context: Partial<ConversationContext> = {}
): Promise<AssessmentResponse> {
  // Determine conversation stage
  const stage = determineConversationStage(conversationHistory, context);

  switch (stage) {
    case "greeting":
      return handleGreeting(userMessage, context);
    case "gathering":
      return handleContextGathering(userMessage, conversationHistory, context);
    case "analyzing":
      return handleAnalysis(userMessage, conversationHistory, context);
    default:
      return handleGreeting(userMessage, context);
  }
}

/**
 * Determine current conversation stage based on history and context
 */
function determineConversationStage(
  history: ConversationMessage[],
  context: Partial<ConversationContext>
): "greeting" | "gathering" | "analyzing" {
  // First message = greeting
  if (history.length === 0) {
    return "greeting";
  }

  // If we have enough context, move to analysis
  const hasSymptoms = context.symptoms && context.symptoms.length > 0;
  const hasDuration = !!context.duration;
  const hasSeverity = !!context.severity;

  if (hasSymptoms && hasDuration && hasSeverity) {
    return "analyzing";
  }

  // Otherwise, keep gathering context
  return "gathering";
}

// ============================================================================
// Stage 1: Greeting & Initial Symptoms
// ============================================================================

async function handleGreeting(
  userMessage: string,
  context: Partial<ConversationContext>
): Promise<AssessmentResponse> {
  // Extract symptoms from initial message
  const symptoms = await extractSymptoms(userMessage);

  // Generate empathetic greeting with follow-up question
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a compassionate medical AI assistant. The patient has just described their symptoms. 
Respond with:
1. Brief empathetic acknowledgment (1 sentence)
2. ONE specific follow-up question to understand duration or severity
Keep it conversational and caring. Use simple language.`
      },
      {
        role: "user",
        content: userMessage
      }
    ]
  });

  const content = response.choices[0].message.content;
  const message = (typeof content === 'string' ? content : "I understand. Can you tell me more about when these symptoms started?") || "I understand. Can you tell me more about when these symptoms started?";

  // Generate quick reply chips for common durations
  const quickReplies: QuickReplyChip[] = [
    { text: "Just today", textAr: "اليوم فقط", value: "today" },
    { text: "2-3 days", textAr: "٢-٣ أيام", value: "2-3_days" },
    { text: "About a week", textAr: "حوالي أسبوع", value: "week" },
    { text: "More than a week", textAr: "أكثر من أسبوع", value: "more_than_week" }
  ];

  return {
    message,
    quickReplies,
    conversationStage: "gathering"
  };
}

// ============================================================================
// Stage 2: Context Gathering (Follow-up Questions)
// ============================================================================

async function handleContextGathering(
  userMessage: string,
  history: ConversationMessage[],
  context: Partial<ConversationContext>
): Promise<AssessmentResponse> {
  // Update context with new information
  const updatedContext = await updateContextFromMessage(userMessage, context);

  // Determine what information is still missing
  const missingInfo = identifyMissingInformation(updatedContext);

  // If we have enough information, move to analysis
  if (missingInfo.length === 0) {
    return handleAnalysis(userMessage, history, updatedContext);
  }

  // Generate next follow-up question
  const nextQuestion = await generateFollowUpQuestion(missingInfo[0], updatedContext);

  // Generate contextual quick replies
  const quickReplies = generateQuickReplies(missingInfo[0], updatedContext);

  return {
    message: nextQuestion,
    quickReplies,
    conversationStage: "gathering"
  };
}

/**
 * Extract and update context from user message
 */
async function updateContextFromMessage(
  message: string,
  currentContext: Partial<ConversationContext>
): Promise<Partial<ConversationContext>> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Extract medical information from the patient's message. Return JSON with these fields (only include if mentioned):
{
  "symptoms": ["symptom1", "symptom2"],
  "duration": "timeframe",
  "severity": "mild|moderate|severe",
  "location": "body part",
  "aggravatingFactors": ["factor1"],
  "relievingFactors": ["factor1"],
  "associatedSymptoms": ["symptom1"],
  "medicalHistory": ["condition1"],
  "medications": ["med1"]
}`
      },
      {
        role: "user",
        content: message
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "medical_context",
        strict: true,
        schema: {
          type: "object",
          properties: {
            symptoms: { type: "array", items: { type: "string" } },
            duration: { type: "string" },
            severity: { type: "string" },
            location: { type: "string" },
            aggravatingFactors: { type: "array", items: { type: "string" } },
            relievingFactors: { type: "array", items: { type: "string" } },
            associatedSymptoms: { type: "array", items: { type: "string" } },
            medicalHistory: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } }
          },
          required: [],
          additionalProperties: false
        }
      }
    }
  });

  const extractedContent = response.choices[0].message.content;
  const extractedStr = typeof extractedContent === 'string' ? extractedContent : '{}';
  const extracted = JSON.parse(extractedStr || "{}");

  // Merge with current context
  return {
    ...currentContext,
    symptoms: [...(currentContext.symptoms || []), ...(extracted.symptoms || [])],
    duration: extracted.duration || currentContext.duration,
    severity: extracted.severity || currentContext.severity,
    location: extracted.location || currentContext.location,
    aggravatingFactors: [...(currentContext.aggravatingFactors || []), ...(extracted.aggravatingFactors || [])],
    relievingFactors: [...(currentContext.relievingFactors || []), ...(extracted.relievingFactors || [])],
    associatedSymptoms: [...(currentContext.associatedSymptoms || []), ...(extracted.associatedSymptoms || [])],
    medicalHistory: [...(currentContext.medicalHistory || []), ...(extracted.medicalHistory || [])],
    medications: [...(currentContext.medications || []), ...(extracted.medications || [])]
  };
}

/**
 * Identify what critical information is still missing
 */
function identifyMissingInformation(context: Partial<ConversationContext>): string[] {
  const missing: string[] = [];

  if (!context.symptoms || context.symptoms.length === 0) {
    missing.push("symptoms");
  }
  if (!context.duration) {
    missing.push("duration");
  }
  if (!context.severity) {
    missing.push("severity");
  }

  return missing;
}

/**
 * Generate intelligent follow-up question
 */
async function generateFollowUpQuestion(
  missingInfo: string,
  context: Partial<ConversationContext>
): Promise<string> {
  const questionPrompts: Record<string, string> = {
    symptoms: "What symptoms are you experiencing?",
    duration: "How long have you been experiencing these symptoms?",
    severity: "How would you describe the severity? Is it mild, moderate, or severe?",
    location: "Where exactly do you feel this?",
    aggravatingFactors: "Does anything make it worse?",
    relievingFactors: "Does anything make it better?"
  };

  return questionPrompts[missingInfo] || "Can you tell me more about your symptoms?";
}

/**
 * Generate contextual quick reply chips
 */
function generateQuickReplies(
  missingInfo: string,
  context: Partial<ConversationContext>
): QuickReplyChip[] {
  const replyOptions: Record<string, QuickReplyChip[]> = {
    duration: [
      { text: "Just today", textAr: "اليوم فقط", value: "today" },
      { text: "2-3 days", textAr: "٢-٣ أيام", value: "2-3_days" },
      { text: "About a week", textAr: "حوالي أسبوع", value: "week" },
      { text: "More than a week", textAr: "أكثر من أسبوع", value: "more_than_week" }
    ],
    severity: [
      { text: "Mild", textAr: "خفيف", value: "mild" },
      { text: "Moderate", textAr: "متوسط", value: "moderate" },
      { text: "Severe", textAr: "شديد", value: "severe" }
    ],
    aggravatingFactors: [
      { text: "Physical activity", textAr: "النشاط البدني", value: "activity" },
      { text: "Eating", textAr: "الأكل", value: "eating" },
      { text: "Stress", textAr: "التوتر", value: "stress" },
      { text: "Nothing specific", textAr: "لا شيء محدد", value: "none" }
    ],
    relievingFactors: [
      { text: "Rest", textAr: "الراحة", value: "rest" },
      { text: "Medication", textAr: "الدواء", value: "medication" },
      { text: "Nothing helps", textAr: "لا شيء يساعد", value: "none" }
    ]
  };

  return replyOptions[missingInfo] || [];
}

// ============================================================================
// Stage 3: Analysis & Triage
// ============================================================================

async function handleAnalysis(
  userMessage: string,
  history: ConversationMessage[],
  context: Partial<ConversationContext>
): Promise<AssessmentResponse> {
  // Build comprehensive symptom description
  const symptomDescription = buildSymptomDescription(context);

  // Analyze with BRAIN (differential diagnosis)
  const brainAnalysis = await enhancedBrain.reason({
    symptoms: context.symptoms || [],
    patientInfo: {
      age: context.age || 30,
      gender: (context.gender as 'male' | 'female' | 'other') || 'other',
      medicalHistory: context.medicalHistory || []
    },
    language: 'en'
  });

  // Validate top diagnoses with Avicenna-X
  const validatedDiagnoses = await Promise.all(
    brainAnalysis.diagnosis.differentialDiagnosis.slice(0, 3).map(async (dx: any) => {
      const validation = await validateMedicalConcept(dx.condition, "diagnosis");
      return {
        condition: dx.condition,
        probability: dx.probability,
        reasoning: dx.reasoning,
        validated: validation.isValid
      };
    })
  );

  // Determine triage level
  const triage = determineTriageLevel(context, brainAnalysis);

  // Generate recommendations
  const recommendations = generateRecommendations(triage.level, brainAnalysis);

  // Generate Arabic translations
  const messageAr = await translateToArabic(triage.message);
  const triageReasonAr = await translateToArabic(triage.reason);
  const recommendationsAr = await Promise.all(
    recommendations.map(r => translateToArabic(r))
  );

  return {
    message: triage.message,
    messageAr,
    triageLevel: triage.level,
    triageReason: triage.reason,
    triageReasonAr,
    recommendations,
    recommendationsAr,
    differentialDiagnosis: validatedDiagnoses.map(dx => ({
      condition: dx.condition,
      probability: dx.probability,
      reasoning: dx.reasoning
    })),
    showActions: true, // Show "Find Doctor" and "Book Appointment" buttons
    conversationStage: "complete"
  };
}

/**
 * Build comprehensive symptom description from context
 */
function buildSymptomDescription(context: Partial<ConversationContext>): string {
  const parts: string[] = [];

  if (context.symptoms && context.symptoms.length > 0) {
    parts.push(`Symptoms: ${context.symptoms.join(", ")}`);
  }
  if (context.duration) {
    parts.push(`Duration: ${context.duration}`);
  }
  if (context.severity) {
    parts.push(`Severity: ${context.severity}`);
  }
  if (context.location) {
    parts.push(`Location: ${context.location}`);
  }
  if (context.associatedSymptoms && context.associatedSymptoms.length > 0) {
    parts.push(`Associated symptoms: ${context.associatedSymptoms.join(", ")}`);
  }
  if (context.aggravatingFactors && context.aggravatingFactors.length > 0) {
    parts.push(`Aggravating factors: ${context.aggravatingFactors.join(", ")}`);
  }
  if (context.relievingFactors && context.relievingFactors.length > 0) {
    parts.push(`Relieving factors: ${context.relievingFactors.join(", ")}`);
  }

  return parts.join(". ");
}

/**
 * Determine triage level based on symptoms and analysis
 */
function determineTriageLevel(
  context: Partial<ConversationContext>,
  brainAnalysis: any
): { level: TriageLevel; reason: string; message: string } {
  // Red flags (emergency)
  const redFlags = [
    "chest pain",
    "difficulty breathing",
    "severe bleeding",
    "loss of consciousness",
    "severe headache",
    "stroke symptoms",
    "severe abdominal pain",
    "suicidal thoughts"
  ];

  const symptomsLower = context.symptoms?.map(s => s.toLowerCase()) || [];
  const hasRedFlag = redFlags.some(flag => 
    symptomsLower.some(symptom => symptom.includes(flag))
  );

  if (hasRedFlag || context.severity === "severe") {
    return {
      level: "red",
      reason: "Severe symptoms requiring immediate medical attention",
      message: "Based on your symptoms, I recommend seeking immediate medical care. This appears to require urgent evaluation."
    };
  }

  // Yellow flags (urgent but not emergency)
  if (context.severity === "moderate" || (context.duration && context.duration.includes("week"))) {
    return {
      level: "yellow",
      reason: "Moderate symptoms that should be evaluated soon",
      message: "Your symptoms suggest you should see a healthcare provider within the next 1-2 days for proper evaluation."
    };
  }

  // Green (routine care)
  return {
    level: "green",
    reason: "Mild symptoms that can be managed with routine care",
    message: "Your symptoms appear to be mild. Consider scheduling a routine appointment with your healthcare provider if symptoms persist or worsen."
  };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(triageLevel: TriageLevel, brainAnalysis: any): string[] {
  const recommendations: string[] = [];

  switch (triageLevel) {
    case "red":
      recommendations.push("Seek emergency medical care immediately");
      recommendations.push("Call emergency services or go to the nearest emergency room");
      recommendations.push("Do not drive yourself - have someone take you or call an ambulance");
      break;
    case "yellow":
      recommendations.push("Schedule an appointment with your healthcare provider within 1-2 days");
      recommendations.push("Monitor your symptoms closely");
      recommendations.push("Seek immediate care if symptoms worsen");
      break;
    case "green":
      recommendations.push("Rest and stay hydrated");
      recommendations.push("Monitor symptoms for any changes");
      recommendations.push("Consider over-the-counter remedies if appropriate");
      recommendations.push("Schedule a routine appointment if symptoms persist beyond a few days");
      break;
  }

  return recommendations;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract symptoms from natural language
 */
async function extractSymptoms(text: string): Promise<string[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Extract all medical symptoms mentioned in the text. Return as JSON array of strings."
      },
      {
        role: "user",
        content: text
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "symptoms",
        strict: true,
        schema: {
          type: "object",
          properties: {
            symptoms: { type: "array", items: { type: "string" } }
          },
          required: ["symptoms"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const result = JSON.parse(contentStr || '{"symptoms":[]}');
  return result.symptoms || [];
}

/**
 * Translate text to Arabic
 */
async function translateToArabic(text: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Translate the following medical text to Arabic. Maintain medical accuracy and cultural sensitivity."
      },
      {
        role: "user",
        content: text
      }
    ]
  });

  const content = response.choices[0].message.content;
  return (typeof content === 'string' ? content : text) || text;
}
