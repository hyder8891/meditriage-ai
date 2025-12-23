/**
 * Conversational Assessment Engine
 * 
 * Implements intelligent, context-aware conversational flow for symptom assessment
 */

import { invokeLLM } from "./_core/llm";

// ============================================================================
// Types
// ============================================================================

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationContext {
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

export interface QuickReplyChip {
  text: string;
  textAr: string;
  value: string;
}

export interface AssessmentResponse {
  message: string;
  messageAr?: string;
  quickReplies?: QuickReplyChip[];
  conversationStage: "greeting" | "gathering" | "analyzing";
  triageResult?: {
    urgency: "emergency" | "urgent" | "routine" | "self_care";
    possibleConditions: Array<{
      name: string;
      probability: number;
      reasoning: string;
    }>;
    recommendations: string[];
  };
  updatedContext?: Partial<ConversationContext>;
}

// ============================================================================
// Main Processing Function
// ============================================================================

export async function processConversationalAssessment(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  context: Partial<ConversationContext>
): Promise<AssessmentResponse> {
  // Determine current conversation stage
  const stage = determineConversationStage(conversationHistory, context);

  // Route to appropriate handler
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

// ============================================================================
// Stage Detection
// ============================================================================

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
    conversationStage: "gathering",
    updatedContext: { symptoms } // Return extracted symptoms
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
    conversationStage: "gathering",
    updatedContext // Return updated context to frontend
  };
}

/**
 * Extract and update context from user message
 */
async function updateContextFromMessage(
  userMessage: string,
  currentContext: Partial<ConversationContext>
): Promise<Partial<ConversationContext>> {
  try {
    // Use LLM to extract structured information from user message
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Extract medical information from the user's message. Return a JSON object with any relevant fields.`
        },
        {
          role: "user",
          content: userMessage
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
  } catch (error) {
    console.error("Error extracting context from message:", error);
    // Return current context unchanged if extraction fails
    return currentContext;
  }
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
  // Build comprehensive context summary
  const contextSummary = buildContextSummary(context);

  // Generate differential diagnosis and triage recommendation
  const analysisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a medical triage AI. Based on the patient's symptoms and context, provide:
1. Triage urgency level (emergency, urgent, routine, self_care)
2. Top 3 possible conditions with probability (0-100)
3. Clear, actionable recommendations

Be conservative with urgency - when in doubt, recommend seeking medical attention.
Return your response in JSON format.`
      },
      {
        role: "user",
        content: contextSummary
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "triage_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            urgency: {
              type: "string",
              enum: ["emergency", "urgent", "routine", "self_care"]
            },
            possibleConditions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  probability: { type: "number" },
                  reasoning: { type: "string" }
                },
                required: ["name", "probability", "reasoning"],
                additionalProperties: false
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["urgency", "possibleConditions", "recommendations"],
          additionalProperties: false
        }
      }
    }
  });

  const analysisContent = analysisResponse.choices[0].message.content;
  const analysisStr = typeof analysisContent === 'string' ? analysisContent : '{}';
  const triageResult = JSON.parse(analysisStr || "{}");

  // Generate human-readable summary message
  const summaryMessage = generateSummaryMessage(triageResult);

  return {
    message: summaryMessage,
    conversationStage: "analyzing",
    triageResult,
    updatedContext: context
  };
}

/**
 * Build context summary for analysis
 */
function buildContextSummary(context: Partial<ConversationContext>): string {
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
  if (context.aggravatingFactors && context.aggravatingFactors.length > 0) {
    parts.push(`Aggravating factors: ${context.aggravatingFactors.join(", ")}`);
  }
  if (context.relievingFactors && context.relievingFactors.length > 0) {
    parts.push(`Relieving factors: ${context.relievingFactors.join(", ")}`);
  }
  if (context.associatedSymptoms && context.associatedSymptoms.length > 0) {
    parts.push(`Associated symptoms: ${context.associatedSymptoms.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Generate human-readable summary message
 */
function generateSummaryMessage(triageResult: any): string {
  const urgencyMessages: Record<string, string> = {
    emergency: "⚠️ Based on your symptoms, I recommend seeking emergency medical attention immediately.",
    urgent: "⚠️ Your symptoms suggest you should see a healthcare provider soon, ideally within 24 hours.",
    routine: "Based on your symptoms, I recommend scheduling an appointment with your healthcare provider.",
    self_care: "Your symptoms may be manageable with self-care, but monitor them closely."
  };

  const baseMessage = urgencyMessages[triageResult.urgency] || urgencyMessages.routine;
  
  const conditions = triageResult.possibleConditions
    .slice(0, 3)
    .map((c: any, i: number) => `${i + 1}. ${c.name} (${c.probability}%)`)
    .join("\n");

  return `${baseMessage}\n\nPossible conditions to discuss with your doctor:\n${conditions}\n\nRemember: This is not a diagnosis. Please consult a healthcare professional for proper evaluation.`;
}

/**
 * Extract symptoms from user message
 */
async function extractSymptoms(message: string): Promise<string[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Extract all symptoms mentioned in the user's message. Return as a JSON array of strings."
        },
        {
          role: "user",
          content: message
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
              symptoms: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["symptoms"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : '{}';
    const parsed = JSON.parse(contentStr || "{}");
    return parsed.symptoms || [];
  } catch (error) {
    console.error("Error extracting symptoms:", error);
    return [];
  }
}
